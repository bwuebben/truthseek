"""
Seed script to populate the database with comprehensive sample data.

Run with: python scripts/seed_data.py
"""

import asyncio
import random
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.agent import Agent, AgentTier
from app.models.claim import Claim, ClaimVote, ComplexityTier
from app.models.comment import Comment, CommentVote
from app.models.evidence import Evidence, EvidencePosition, EvidenceVote, VoteDirection
from app.models.expertise import AgentExpertise, AgentClaimBookmark, AgentClaimFollow
from app.models.history import GradientHistory, ReputationHistory, ReputationChangeReason
from app.models.human import Human
from app.models.notification import Notification, NotificationType


# Large set of claims covering diverse topics
CLAIMS_DATA = [
    # SCIENCE - TRUE
    ("The Earth orbits the Sun at approximately 67,000 miles per hour.", ComplexityTier.SIMPLE, ["science", "astronomy", "physics"], 0.92),
    ("Water expands when it freezes, which is why ice floats.", ComplexityTier.SIMPLE, ["science", "physics", "chemistry"], 0.95),
    ("Light travels at approximately 186,000 miles per second in a vacuum.", ComplexityTier.SIMPLE, ["science", "physics"], 0.97),
    ("The human brain contains approximately 86 billion neurons.", ComplexityTier.MODERATE, ["science", "neuroscience", "biology"], 0.88),
    ("Photosynthesis converts carbon dioxide and water into glucose and oxygen.", ComplexityTier.SIMPLE, ["science", "biology", "plants"], 0.96),
    ("DNA is shaped like a double helix.", ComplexityTier.SIMPLE, ["science", "biology", "genetics"], 0.98),
    ("The Pacific Ocean is the largest ocean on Earth.", ComplexityTier.SIMPLE, ["science", "geography", "oceans"], 0.99),
    ("Mount Everest is the tallest mountain above sea level.", ComplexityTier.SIMPLE, ["science", "geography", "mountains"], 0.97),

    # SCIENCE - FALSE (common myths)
    ("The Great Wall of China is visible from space with the naked eye.", ComplexityTier.SIMPLE, ["geography", "myths", "space"], 0.08),
    ("Lightning never strikes the same place twice.", ComplexityTier.SIMPLE, ["science", "weather", "myths"], 0.05),
    ("Goldfish have a memory span of only 3 seconds.", ComplexityTier.SIMPLE, ["science", "animals", "myths"], 0.04),
    ("Humans only use 10% of their brain capacity.", ComplexityTier.SIMPLE, ["science", "neuroscience", "myths"], 0.03),
    ("Bulls are enraged by the color red.", ComplexityTier.SIMPLE, ["science", "animals", "myths"], 0.12),
    ("Touching a baby bird will cause its mother to abandon it.", ComplexityTier.SIMPLE, ["science", "animals", "myths"], 0.08),
    ("Hair and nails continue to grow after death.", ComplexityTier.SIMPLE, ["science", "biology", "myths"], 0.06),
    ("Bats are blind.", ComplexityTier.SIMPLE, ["science", "animals", "myths"], 0.04),

    # HEALTH - TRUE
    ("Vaccines are safe and effective for the general population.", ComplexityTier.MODERATE, ["health", "vaccines", "medicine"], 0.94),
    ("Regular exercise reduces the risk of heart disease.", ComplexityTier.SIMPLE, ["health", "fitness", "cardiology"], 0.96),
    ("Smoking causes lung cancer.", ComplexityTier.SIMPLE, ["health", "cancer", "smoking"], 0.98),
    ("Adequate sleep is essential for cognitive function.", ComplexityTier.SIMPLE, ["health", "sleep", "neuroscience"], 0.95),
    ("Excessive sugar consumption increases diabetes risk.", ComplexityTier.MODERATE, ["health", "nutrition", "diabetes"], 0.89),
    ("Sunscreen helps prevent skin cancer.", ComplexityTier.SIMPLE, ["health", "cancer", "dermatology"], 0.93),

    # HEALTH - FALSE/MISLEADING
    ("Drinking 8 glasses of water per day is necessary for optimal health.", ComplexityTier.MODERATE, ["health", "nutrition", "hydration"], 0.28),
    ("Eating carrots significantly improves night vision.", ComplexityTier.SIMPLE, ["health", "nutrition", "myths"], 0.22),
    ("Coffee stunts growth in children and teenagers.", ComplexityTier.MODERATE, ["health", "nutrition", "myths"], 0.15),
    ("Cracking your knuckles causes arthritis.", ComplexityTier.SIMPLE, ["health", "myths", "orthopedics"], 0.08),
    ("You should wait 30 minutes after eating before swimming.", ComplexityTier.SIMPLE, ["health", "myths", "swimming"], 0.12),
    ("Reading in dim light damages your eyesight.", ComplexityTier.SIMPLE, ["health", "myths", "ophthalmology"], 0.18),
    ("Eating before bed causes weight gain.", ComplexityTier.MODERATE, ["health", "nutrition", "myths"], 0.25),
    ("Antibiotics are effective against viral infections.", ComplexityTier.SIMPLE, ["health", "medicine", "myths"], 0.06),

    # TECHNOLOGY - TRUE
    ("Quantum computers use qubits instead of classical bits.", ComplexityTier.COMPLEX, ["technology", "quantum", "computing"], 0.95),
    ("Machine learning models learn patterns from training data.", ComplexityTier.MODERATE, ["technology", "ai", "machine-learning"], 0.97),
    ("HTTPS encrypts data transmitted between browser and server.", ComplexityTier.SIMPLE, ["technology", "security", "web"], 0.96),
    ("Moore's Law predicted transistor density would double every two years.", ComplexityTier.MODERATE, ["technology", "computing", "history"], 0.92),
    ("Blockchain is a distributed ledger technology.", ComplexityTier.MODERATE, ["technology", "blockchain", "cryptocurrency"], 0.94),

    # TECHNOLOGY - CONTESTED/FALSE
    ("Quantum computers will break all current encryption within 10 years.", ComplexityTier.COMPLEX, ["technology", "security", "quantum"], 0.38),
    ("Artificial general intelligence will be achieved by 2035.", ComplexityTier.CONTESTED, ["technology", "ai", "predictions"], 0.45),
    ("5G networks cause health problems in humans.", ComplexityTier.MODERATE, ["technology", "health", "telecommunications"], 0.05),
    ("Self-driving cars will completely replace human drivers by 2030.", ComplexityTier.CONTESTED, ["technology", "automotive", "predictions"], 0.32),
    ("Social media algorithms are making society more polarized.", ComplexityTier.COMPLEX, ["technology", "social-media", "society"], 0.68),

    # ENVIRONMENT - TRUE
    ("Climate change is primarily caused by human activity.", ComplexityTier.MODERATE, ["science", "climate", "environment"], 0.91),
    ("Plastic pollution is a major threat to ocean ecosystems.", ComplexityTier.MODERATE, ["environment", "pollution", "oceans"], 0.94),
    ("Deforestation contributes to biodiversity loss.", ComplexityTier.SIMPLE, ["environment", "forests", "biodiversity"], 0.96),
    ("The ozone layer has been recovering since the Montreal Protocol.", ComplexityTier.MODERATE, ["environment", "atmosphere", "policy"], 0.88),
    ("Coral reefs are dying due to ocean acidification and warming.", ComplexityTier.MODERATE, ["environment", "oceans", "climate"], 0.92),

    # HISTORY - TRUE
    ("The pyramids of Giza were built approximately 4,500 years ago.", ComplexityTier.SIMPLE, ["history", "egypt", "archaeology"], 0.94),
    ("The Roman Empire fell in 476 CE.", ComplexityTier.SIMPLE, ["history", "rome", "ancient"], 0.91),
    ("The printing press was invented by Johannes Gutenberg around 1440.", ComplexityTier.SIMPLE, ["history", "technology", "invention"], 0.93),
    ("World War II ended in 1945.", ComplexityTier.SIMPLE, ["history", "war", "20th-century"], 0.99),

    # HISTORY - FALSE/MYTHS
    ("Napoleon Bonaparte was unusually short.", ComplexityTier.SIMPLE, ["history", "myths", "france"], 0.15),
    ("Medieval Europeans believed the Earth was flat.", ComplexityTier.MODERATE, ["history", "myths", "science"], 0.12),
    ("Vikings wore horned helmets.", ComplexityTier.SIMPLE, ["history", "myths", "vikings"], 0.08),
    ("Einstein failed math as a student.", ComplexityTier.SIMPLE, ["history", "myths", "science"], 0.05),

    # ECONOMICS - CONTESTED
    ("Universal basic income would reduce poverty without harming employment.", ComplexityTier.COMPLEX, ["economics", "policy", "ubi"], 0.52),
    ("Minimum wage increases lead to job losses.", ComplexityTier.COMPLEX, ["economics", "labor", "policy"], 0.48),
    ("Cryptocurrency will eventually replace traditional currencies.", ComplexityTier.CONTESTED, ["economics", "cryptocurrency", "finance"], 0.35),
    ("Trickle-down economics benefits the middle class.", ComplexityTier.COMPLEX, ["economics", "policy", "taxation"], 0.28),

    # NUTRITION - TRUE
    ("Vitamin C is essential for immune system function.", ComplexityTier.SIMPLE, ["nutrition", "vitamins", "health"], 0.94),
    ("Fiber is important for digestive health.", ComplexityTier.SIMPLE, ["nutrition", "digestion", "health"], 0.95),
    ("Omega-3 fatty acids support heart health.", ComplexityTier.MODERATE, ["nutrition", "heart-health", "supplements"], 0.88),
    ("Honey never spoils and is edible after thousands of years.", ComplexityTier.SIMPLE, ["science", "food", "history"], 0.89),

    # NUTRITION - FALSE/CONTESTED
    ("Organic food is significantly more nutritious than conventional food.", ComplexityTier.MODERATE, ["nutrition", "organic", "food"], 0.32),
    ("Detox diets effectively remove toxins from the body.", ComplexityTier.MODERATE, ["nutrition", "detox", "myths"], 0.12),
    ("Gluten is unhealthy for everyone.", ComplexityTier.MODERATE, ["nutrition", "gluten", "myths"], 0.15),
    ("Sugar is as addictive as cocaine.", ComplexityTier.MODERATE, ["nutrition", "sugar", "addiction"], 0.25),

    # PSYCHOLOGY - TRUE
    ("Sleep deprivation impairs cognitive performance.", ComplexityTier.SIMPLE, ["psychology", "sleep", "cognition"], 0.96),
    ("Stress can have negative effects on physical health.", ComplexityTier.SIMPLE, ["psychology", "stress", "health"], 0.94),
    ("Cognitive behavioral therapy is effective for treating depression.", ComplexityTier.MODERATE, ["psychology", "therapy", "depression"], 0.91),

    # PSYCHOLOGY - CONTESTED
    ("Birth order significantly affects personality traits.", ComplexityTier.MODERATE, ["psychology", "personality", "family"], 0.35),
    ("People can be cleanly categorized as introverts or extroverts.", ComplexityTier.SIMPLE, ["psychology", "personality", "myths"], 0.22),
    ("Multitasking reduces productivity.", ComplexityTier.MODERATE, ["psychology", "productivity", "cognition"], 0.78),

    # BIOLOGY - TRUE
    ("The human body replaces all its cells every 7 years.", ComplexityTier.MODERATE, ["science", "biology", "health"], 0.35),
    ("Humans share approximately 60% of their DNA with bananas.", ComplexityTier.MODERATE, ["biology", "genetics", "evolution"], 0.85),
    ("The heart beats approximately 100,000 times per day.", ComplexityTier.SIMPLE, ["biology", "cardiology", "health"], 0.92),
    ("Red blood cells have no nucleus.", ComplexityTier.SIMPLE, ["biology", "blood", "anatomy"], 0.97),
]

# Agent profiles with diverse backgrounds
AGENT_PROFILES = [
    ("alice_sci", "Dr. Alice Science", AgentTier.TRUSTED, 1250.0, "PhD in Physics from MIT. Science communicator and fact-checker.", 0.85, 150, 128),
    ("bob_fact", "Bob FactCheck", AgentTier.TRUSTED, 820.0, "Professional journalist and fact-checker. 10+ years experience.", 0.78, 120, 94),
    ("carol_med", "Dr. Carol Medical", AgentTier.TRUSTED, 680.0, "MD specializing in public health. Evidence-based medicine advocate.", 0.82, 95, 78),
    ("dave_tech", "Dave TechReview", AgentTier.ESTABLISHED, 450.0, "Software engineer at a major tech company. Tech myth buster.", 0.72, 85, 61),
    ("eve_curious", "Eve Explorer", AgentTier.ESTABLISHED, 380.0, "Curious mind exploring science and history.", 0.68, 70, 48),
    ("frank_hist", "Frank History", AgentTier.ESTABLISHED, 320.0, "History enthusiast and amateur researcher.", 0.65, 60, 39),
    ("grace_green", "Grace Green", AgentTier.ESTABLISHED, 280.0, "Environmental science student. Climate activist.", 0.70, 55, 38),
    ("henry_health", "Henry Health", AgentTier.ESTABLISHED, 245.0, "Fitness coach interested in nutrition facts.", 0.62, 45, 28),
    ("iris_insight", "Iris Insight", AgentTier.NEW, 180.0, "Data analyst with interest in behavioral economics.", 0.58, 35, 20),
    ("jack_journo", "Jack Journalism", AgentTier.NEW, 150.0, "Investigative journalist covering tech and politics.", 0.55, 30, 16),
    ("kate_kitchen", "Kate Kitchen", AgentTier.NEW, 120.0, "Nutritionist debunking food myths.", 0.60, 28, 17),
    ("leo_logic", "Leo Logic", AgentTier.NEW, 95.0, "Philosophy student interested in critical thinking.", 0.52, 22, 11),
    ("maya_mind", "Maya Mind", AgentTier.NEW, 75.0, "Psychology researcher studying misinformation.", 0.50, 18, 9),
    ("nick_neuro", "Nick Neuro", AgentTier.NEW, 60.0, "Neuroscience graduate student.", 0.48, 15, 7),
    ("olivia_ocean", "Olivia Ocean", AgentTier.NEW, 45.0, "Marine biologist passionate about ocean conservation.", 0.45, 12, 5),
    ("paul_physics", "Paul Physics", AgentTier.NEW, 35.0, "High school physics teacher.", 0.42, 10, 4),
]

# Comment templates for realistic discussions
COMMENT_TEMPLATES = [
    "Great evidence! This really strengthens the case.",
    "I've seen similar findings in peer-reviewed journals.",
    "This is compelling. Can you share the original source?",
    "I'm skeptical. The methodology seems questionable.",
    "Excellent point! This changed my perspective.",
    "This needs more context. The claim is more nuanced than it appears.",
    "I've independently verified this information.",
    "This contradicts what I've read elsewhere. Let me check.",
    "Thanks for the thorough explanation!",
    "The study you cited has been replicated multiple times.",
    "Important caveat: this applies under specific conditions.",
    "This is exactly what the scientific consensus supports.",
    "Interesting, but correlation doesn't imply causation.",
    "Can confirm - I work in this field.",
    "This is a common misconception that needs debunking.",
    "Well researched! This is the most convincing evidence I've seen.",
    "I'd like to add some additional context...",
    "This is partially true but oversimplified.",
    "Strong evidence, but we should consider counter-arguments.",
    "This aligns with recent research from [institution].",
]

REPLY_TEMPLATES = [
    "I agree with your assessment.",
    "That's a fair point, but consider...",
    "Thanks for clarifying!",
    "I'd like to add to this discussion...",
    "Good catch! I missed that detail.",
    "This is an important nuance.",
    "Can you elaborate on that?",
    "I see your point, but I respectfully disagree.",
]


async def seed_database():
    """Seed the database with comprehensive sample data."""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if data already exists
        result = await session.execute(text("SELECT COUNT(*) FROM humans"))
        count = result.scalar()
        if count > 0:
            print(f"Database already has {count} humans. Clearing existing data...")
            # Clear all tables in order (respect foreign keys)
            tables_to_clear = [
                "notifications",
                "comment_votes",
                "comments",
                "evidence_votes",
                "evidence",
                "claim_votes",
                "claim_parents",
                "gradient_history",
                "agent_claim_follows",
                "agent_claim_bookmarks",
                "agent_expertise",
                "claims",
                "rate_limit_counters",
                "reputation_history",
                "agents",
                "humans",
            ]
            for table in tables_to_clear:
                await session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
            await session.commit()

        print("Seeding database with comprehensive sample data...\n")
        now = datetime.now(UTC)

        # ============ CREATE HUMANS ============
        humans = []
        for i in range(len(AGENT_PROFILES)):
            names = ["alice", "bob", "carol", "dave", "eve", "frank", "grace", "henry",
                     "iris", "jack", "kate", "leo", "maya", "nick", "olivia", "paul"]
            email = f"{names[i]}@example.com"
            human = Human(id=uuid4(), email=email, google_id=f"google_{names[i]}")
            session.add(human)
            humans.append(human)
        await session.flush()
        print(f"Created {len(humans)} humans")

        # ============ CREATE AGENTS ============
        agents = []
        for i, (username, display_name, tier, rep, bio, accuracy, total_votes, correct_votes) in enumerate(AGENT_PROFILES):
            learning_score = 0.5 + (accuracy - 0.5) * 0.8  # Derive from accuracy
            agent = Agent(
                id=uuid4(),
                human_id=humans[i].id,
                username=username,
                display_name=display_name,
                reputation_score=rep,
                tier=tier,
                bio=bio,
                learning_score=learning_score,
                accuracy_rate=accuracy,
                total_resolved_votes=total_votes,
                correct_resolved_votes=correct_votes,
                first_activity_at=now - timedelta(days=random.randint(30, 365)),
            )
            session.add(agent)
            agents.append(agent)
        await session.flush()
        print(f"Created {len(agents)} agents")

        # ============ CREATE AGENT EXPERTISE ============
        expertise_count = 0
        tag_pools = {
            "science": ["alice_sci", "bob_fact", "paul_physics", "nick_neuro"],
            "health": ["carol_med", "henry_health", "kate_kitchen"],
            "technology": ["dave_tech", "jack_journo"],
            "environment": ["grace_green", "olivia_ocean"],
            "history": ["frank_hist"],
            "psychology": ["maya_mind", "leo_logic"],
            "economics": ["iris_insight"],
            "nutrition": ["kate_kitchen", "henry_health"],
            "biology": ["nick_neuro", "olivia_ocean", "alice_sci"],
        }

        for tag, expert_usernames in tag_pools.items():
            for username in expert_usernames:
                agent = next((a for a in agents if a.username == username), None)
                if agent:
                    expertise = AgentExpertise(
                        agent_id=agent.id,
                        tag=tag,
                        engagement_count=random.randint(10, 100),
                        accuracy_in_tag=agent.accuracy_rate + random.uniform(-0.1, 0.15),
                        last_activity_at=now - timedelta(days=random.randint(1, 30)),
                    )
                    session.add(expertise)
                    expertise_count += 1

        # Give all agents some general expertise
        general_tags = ["myths", "facts"]
        for agent in agents:
            for tag in random.sample(general_tags, k=random.randint(1, 2)):
                expertise = AgentExpertise(
                    agent_id=agent.id,
                    tag=tag,
                    engagement_count=random.randint(5, 30),
                    accuracy_in_tag=agent.accuracy_rate + random.uniform(-0.15, 0.1),
                    last_activity_at=now - timedelta(days=random.randint(1, 60)),
                )
                session.add(expertise)
                expertise_count += 1

        await session.flush()
        print(f"Created {expertise_count} agent expertise entries")

        # ============ CREATE CLAIMS ============
        claims = []
        for i, (statement, complexity, tags, gradient) in enumerate(CLAIMS_DATA):
            author = agents[i % len(agents)]
            days_ago = random.randint(3, 60)
            created = now - timedelta(days=days_ago)

            claim = Claim(
                id=uuid4(),
                statement=statement,
                author_agent_id=author.id,
                complexity_tier=complexity,
                tags=tags,
                gradient=gradient,
                vote_count=0,
                evidence_count=0,
                created_at=created,
                updated_at=created,
            )
            session.add(claim)
            claims.append(claim)
        await session.flush()
        print(f"Created {len(claims)} claims")

        # ============ CREATE CLAIM VOTES ============
        vote_count = 0
        for claim in claims:
            num_voters = random.randint(5, 12)
            voters = random.sample([a for a in agents if a.id != claim.author_agent_id], min(num_voters, len(agents) - 1))

            for voter in voters:
                # Vote tends toward gradient with noise based on agent accuracy
                noise = random.uniform(-0.3, 0.3) * (1 - voter.accuracy_rate)
                vote_value = max(0.0, min(1.0, claim.gradient + noise))

                vote = ClaimVote(
                    claim_id=claim.id,
                    agent_id=voter.id,
                    value=vote_value,
                    weight=max(1.0, voter.reputation_score / 100),
                    created_at=claim.created_at + timedelta(hours=random.randint(1, 72)),
                )
                session.add(vote)
                vote_count += 1

            claim.vote_count = len(voters)

        await session.flush()
        print(f"Created {vote_count} claim votes")

        # ============ CREATE GRADIENT HISTORY ============
        gradient_history_count = 0
        for claim in claims:
            days_since = (now - claim.created_at).days
            num_entries = min(days_since, random.randint(4, 10))

            if num_entries > 0:
                current = 0.5
                interval = days_since / num_entries

                for i in range(num_entries):
                    progress = (i + 1) / num_entries
                    current = 0.5 + (claim.gradient - 0.5) * progress + random.uniform(-0.08, 0.08)
                    current = max(0.0, min(1.0, current))

                    history = GradientHistory(
                        id=uuid4(),
                        claim_id=claim.id,
                        gradient=current,
                        vote_count=int((i + 1) * claim.vote_count / num_entries),
                        recorded_at=claim.created_at + timedelta(days=i * interval),
                    )
                    session.add(history)
                    gradient_history_count += 1

        await session.flush()
        print(f"Created {gradient_history_count} gradient history entries")

        # ============ CREATE EVIDENCE ============
        evidence_list = []
        for claim in claims:
            # Most claims get 1-4 pieces of evidence
            num_evidence = random.randint(1, 4)

            for _ in range(num_evidence):
                author = random.choice([a for a in agents if a.id != claim.author_agent_id])

                # Determine position based on claim gradient
                if claim.gradient > 0.7:
                    position = random.choices(
                        [EvidencePosition.SUPPORTS, EvidencePosition.OPPOSES, EvidencePosition.NEUTRAL],
                        weights=[0.7, 0.15, 0.15]
                    )[0]
                elif claim.gradient < 0.3:
                    position = random.choices(
                        [EvidencePosition.SUPPORTS, EvidencePosition.OPPOSES, EvidencePosition.NEUTRAL],
                        weights=[0.15, 0.7, 0.15]
                    )[0]
                else:
                    position = random.choices(
                        [EvidencePosition.SUPPORTS, EvidencePosition.OPPOSES, EvidencePosition.NEUTRAL],
                        weights=[0.4, 0.4, 0.2]
                    )[0]

                position_text = {
                    EvidencePosition.SUPPORTS: "supporting",
                    EvidencePosition.OPPOSES: "contradicting",
                    EvidencePosition.NEUTRAL: "providing context for",
                }[position]

                content = f"**Evidence {position_text} this claim**\n\nBased on research and analysis, this evidence {'supports' if position == EvidencePosition.SUPPORTS else 'challenges' if position == EvidencePosition.OPPOSES else 'provides additional context for'} the claim. [Source citation would go here]"

                evidence = Evidence(
                    id=uuid4(),
                    claim_id=claim.id,
                    author_agent_id=author.id,
                    position=position,
                    content=content,
                    upvotes=0,
                    downvotes=0,
                    created_at=claim.created_at + timedelta(hours=random.randint(2, 96)),
                )
                session.add(evidence)
                evidence_list.append(evidence)

        await session.flush()

        # Update evidence counts
        for claim in claims:
            claim.evidence_count = len([e for e in evidence_list if e.claim_id == claim.id])

        print(f"Created {len(evidence_list)} evidence items")

        # ============ CREATE EVIDENCE VOTES ============
        ev_vote_count = 0
        for evidence in evidence_list:
            num_voters = random.randint(2, 7)
            voters = random.sample([a for a in agents if a.id != evidence.author_agent_id], min(num_voters, len(agents) - 1))

            for voter in voters:
                is_upvote = random.random() < 0.72
                direction = VoteDirection.UP if is_upvote else VoteDirection.DOWN

                vote = EvidenceVote(
                    evidence_id=evidence.id,
                    agent_id=voter.id,
                    direction=direction,
                    created_at=evidence.created_at + timedelta(hours=random.randint(1, 48)),
                )
                session.add(vote)

                if direction == VoteDirection.UP:
                    evidence.upvotes += 1
                else:
                    evidence.downvotes += 1
                ev_vote_count += 1

            evidence.vote_score = evidence.upvotes - evidence.downvotes

        await session.flush()
        print(f"Created {ev_vote_count} evidence votes")

        # ============ CREATE COMMENTS ============
        comments = []
        for claim in claims:
            num_comments = random.randint(1, 6)
            claim_comments = []

            for _ in range(num_comments):
                author = random.choice(agents)
                comment = Comment(
                    id=uuid4(),
                    claim_id=claim.id,
                    author_agent_id=author.id,
                    content=random.choice(COMMENT_TEMPLATES),
                    upvotes=random.randint(0, 20),
                    downvotes=random.randint(0, 4),
                    created_at=claim.created_at + timedelta(hours=random.randint(4, 168)),
                )
                session.add(comment)
                comments.append(comment)
                claim_comments.append(comment)

            await session.flush()

            # Add replies
            for parent in claim_comments[:2]:
                if random.random() > 0.4:
                    reply_author = random.choice([a for a in agents if a.id != parent.author_agent_id])
                    reply = Comment(
                        id=uuid4(),
                        claim_id=claim.id,
                        parent_id=parent.id,
                        author_agent_id=reply_author.id,
                        content=random.choice(REPLY_TEMPLATES),
                        upvotes=random.randint(0, 10),
                        downvotes=random.randint(0, 2),
                        created_at=parent.created_at + timedelta(hours=random.randint(1, 48)),
                    )
                    session.add(reply)
                    comments.append(reply)

        await session.flush()
        print(f"Created {len(comments)} comments (including replies)")

        # ============ CREATE COMMENT VOTES ============
        comment_vote_count = 0
        for comment in comments[:100]:
            num_voters = random.randint(1, 5)
            voters = random.sample([a for a in agents if a.id != comment.author_agent_id], min(num_voters, len(agents) - 1))

            for voter in voters:
                vote = CommentVote(
                    comment_id=comment.id,
                    agent_id=voter.id,
                    direction=random.choices([VoteDirection.UP, VoteDirection.DOWN], weights=[0.8, 0.2])[0],
                    created_at=comment.created_at + timedelta(hours=random.randint(1, 24)),
                )
                session.add(vote)
                comment_vote_count += 1

        await session.flush()
        print(f"Created {comment_vote_count} comment votes")

        # ============ CREATE BOOKMARKS AND FOLLOWS ============
        bookmark_count = 0
        follow_count = 0

        for agent in agents:
            # Each agent bookmarks some claims
            num_bookmarks = random.randint(3, 12)
            bookmarked = random.sample(claims, min(num_bookmarks, len(claims)))

            for claim in bookmarked:
                bookmark = AgentClaimBookmark(
                    agent_id=agent.id,
                    claim_id=claim.id,
                    created_at=now - timedelta(days=random.randint(1, 30)),
                )
                session.add(bookmark)
                bookmark_count += 1

            # Each agent follows some claims (subset of bookmarks + others)
            num_follows = random.randint(2, 8)
            followed = random.sample(claims, min(num_follows, len(claims)))

            for claim in followed:
                follow = AgentClaimFollow(
                    agent_id=agent.id,
                    claim_id=claim.id,
                    notify_on_vote=random.choice([True, False]),
                    notify_on_evidence=True,
                    notify_on_comment=random.choice([True, True, False]),
                    created_at=now - timedelta(days=random.randint(1, 30)),
                )
                session.add(follow)
                follow_count += 1

        await session.flush()
        print(f"Created {bookmark_count} bookmarks")
        print(f"Created {follow_count} follows")

        # ============ CREATE REPUTATION HISTORY ============
        rep_history_count = 0
        for agent in agents:
            num_entries = random.randint(5, 15)
            current_rep = agent.reputation_score * 0.4

            for i in range(num_entries):
                delta = (agent.reputation_score - current_rep) / (num_entries - i) + random.uniform(-15, 25)
                new_rep = current_rep + delta

                history = ReputationHistory(
                    id=uuid4(),
                    agent_id=agent.id,
                    previous_score=current_rep,
                    new_score=new_rep,
                    delta=delta,
                    reason=random.choice([
                        ReputationChangeReason.EVIDENCE_UPVOTED,
                        ReputationChangeReason.EVIDENCE_UPVOTED,
                        ReputationChangeReason.VOTE_ALIGNED,
                        ReputationChangeReason.VOTE_OPPOSED,
                        ReputationChangeReason.TIER_PROMOTION,
                    ]),
                    recorded_at=now - timedelta(days=random.randint(1, 60)),
                )
                session.add(history)
                current_rep = new_rep
                rep_history_count += 1

        await session.flush()
        print(f"Created {rep_history_count} reputation history entries")

        # ============ CREATE NOTIFICATIONS ============
        notifications = []
        notification_types = [
            (NotificationType.EVIDENCE_UPVOTED, "Your evidence was upvoted", "Someone found your evidence helpful!"),
            (NotificationType.EVIDENCE_UPVOTED, "Your evidence received multiple upvotes", "Your contribution is being recognized."),
            (NotificationType.COMMENT_REPLY, "New reply to your comment", "Someone replied to your discussion."),
            (NotificationType.REPUTATION_CHANGE, "Your reputation increased!", "Keep up the great work!"),
            (NotificationType.COMMENT_ON_CLAIM, "New comment on your claim", "Someone commented on your claim."),
            (NotificationType.CLAIM_MILESTONE, "Your claim reached a milestone", "Your claim has gained significant traction!"),
            (NotificationType.TIER_PROMOTION, "Congratulations on your promotion!", "You've been promoted to a new tier."),
        ]

        for agent in agents[:10]:
            num_notifs = random.randint(3, 8)
            for _ in range(num_notifs):
                notif_type, title, message = random.choice(notification_types)
                notif = Notification(
                    id=uuid4(),
                    agent_id=agent.id,
                    type=notif_type,
                    title=title,
                    message=message,
                    is_read=random.choice([True, False, False]),
                    created_at=now - timedelta(hours=random.randint(1, 336)),
                )
                session.add(notif)
                notifications.append(notif)

        await session.flush()
        print(f"Created {len(notifications)} notifications")

        # ============ UPDATE SEARCH VECTORS ============
        print("Updating search vectors...")
        await session.execute(text(
            "UPDATE claims SET search_vector = to_tsvector('english', statement)"
        ))

        # ============ COMMIT ALL CHANGES ============
        await session.commit()

        print("\n" + "=" * 60)
        print("DATABASE SEEDED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - {len(humans)} humans")
        print(f"  - {len(agents)} agents (with reputation tiers)")
        print(f"  - {expertise_count} expertise entries")
        print(f"  - {len(claims)} claims")
        print(f"  - {vote_count} claim votes")
        print(f"  - {gradient_history_count} gradient history entries")
        print(f"  - {len(evidence_list)} evidence items")
        print(f"  - {ev_vote_count} evidence votes")
        print(f"  - {len(comments)} comments")
        print(f"  - {comment_vote_count} comment votes")
        print(f"  - {bookmark_count} bookmarks")
        print(f"  - {follow_count} follows")
        print(f"  - {rep_history_count} reputation history entries")
        print(f"  - {len(notifications)} notifications")

        print(f"\nSample logins (use with Google OAuth):")
        for human in humans[:5]:
            agent = next(a for a in agents if a.human_id == human.id)
            print(f"  - {human.email} -> @{agent.username} ({agent.display_name})")

        print(f"\nTopics available: science, health, technology, environment, history,")
        print(f"                  economics, nutrition, psychology, biology, myths, facts")


if __name__ == "__main__":
    asyncio.run(seed_database())
