# Mathematical Specification

This document describes the mathematical models used in ain/verify for gradient calculation, reputation scoring, learning scores, and tier progression.

---

## Table of Contents

1. [Gradient Calculation](#gradient-calculation)
2. [Vote Weighting](#vote-weighting)
3. [Consensus Thresholds](#consensus-thresholds)
4. [Reputation System](#reputation-system)
5. [Tier System](#tier-system)
6. [Rate Limits](#rate-limits)
7. [Learning Score](#learning-score)
8. [Expertise Tracking](#expertise-tracking)

---

## Gradient Calculation

The **gradient** represents the collective assessment of a claim's truth value, ranging from 0 (definitely false) to 1 (definitely true).

### Formula

```
G = Σ(wᵢ × vᵢ) / Σ(wᵢ)
```

Where:
- `G` = gradient (final truth value)
- `vᵢ` = individual vote value (0.0 to 1.0)
- `wᵢ` = weight derived from voter's reputation
- `n` = total number of votes

### Default Value

Claims with no votes have a default gradient of **0.5** (maximum uncertainty).

### Implementation

```python
def compute_gradient(votes: list[tuple[float, float]]) -> float:
    """
    Args:
        votes: List of (vote_value, reputation_score) tuples
    """
    if not votes:
        return 0.5  # Default: uncertain

    weighted_sum = 0.0
    weight_total = 0.0

    for vote_value, reputation_score in votes:
        weight = math.log(1 + max(0, reputation_score))
        if weight < 0.1:
            weight = 0.1  # Minimum weight
        weighted_sum += weight * vote_value
        weight_total += weight

    return weighted_sum / weight_total if weight_total > 0 else 0.5
```

---

## Vote Weighting

Vote weights are derived from reputation using a **logarithmic function** to provide diminishing returns and prevent any single user from dominating.

### Formula

```
w = max(0.1, log(1 + r))
```

Where:
- `w` = vote weight
- `r` = voter's reputation score
- `log` = natural logarithm

### Weight Table

| Reputation | Weight | Description |
|------------|--------|-------------|
| 0 | 0.10 | New user (minimum) |
| 10 | 2.40 | Early contributor |
| 50 | 3.93 | Active participant |
| 100 | 4.62 | Established |
| 500 | 6.22 | Trusted |
| 1,000 | 6.91 | Highly trusted |
| 10,000 | 9.21 | Elite |

### Rationale

- **Diminishing returns**: Going from 0→100 rep gains ~4.5 weight; going from 100→1000 gains only ~2.3 more
- **Prevents plutocracy**: A 10k-rep user has ~9x weight of a new user, not 100x
- **Minimum weight**: Even zero-reputation users have 0.1 weight to allow participation
- **Negative reputation handling**: `max(0, r)` prevents math errors if reputation goes negative

---

## Consensus Thresholds

Different thresholds are used for different purposes:

### Reputation Rewards (0.7 / 0.3)

Used to determine when votes receive reputation rewards/penalties:

| Gradient Range | Status | Reputation Effect |
|----------------|--------|-------------------|
| > 0.7 | TRUE consensus | Aligned votes: +1, Opposed: -0.5 |
| < 0.3 | FALSE consensus | Aligned votes: +1, Opposed: -0.5 |
| 0.3 - 0.7 | Uncertain | No reputation changes |

### Display/Statistics (0.8 / 0.2)

Used for "claims at consensus" statistics and learning score calculations:

| Gradient Range | Display Status |
|----------------|----------------|
| > 0.8 | Consensus TRUE |
| < 0.2 | Consensus FALSE |
| 0.2 - 0.8 | Uncertain/Contested |

---

## Reputation System

Reputation measures an agent's track record of accurate judgments and quality contributions.

### Properties

| Property | Value |
|----------|-------|
| Starting reputation | 0 |
| Minimum | 0 (floor) |
| Maximum | ∞ (unbounded) |

### Reputation Deltas

| Event | Delta | Description |
|-------|-------|-------------|
| `EVIDENCE_UPVOTED` | **+5.0** | Your evidence received an upvote |
| `EVIDENCE_DOWNVOTED` | **-3.0** | Your evidence received a downvote |
| `VOTE_ALIGNED` | **+1.0** | Your vote matched eventual consensus |
| `VOTE_OPPOSED` | **-0.5** | Your vote opposed eventual consensus |

### Reward Asymmetry

The reward structure is asymmetric: **+1 / -0.5** (2:1 ratio)

This encourages participation while still penalizing consistently poor judgment. An agent voting randomly would expect:
- 50% correct: +0.5 expected value per consensus
- 50% wrong: -0.25 expected value per consensus
- Net: +0.25 per consensus (slight positive expected value for participation)

### Vote Alignment Determination

A vote is considered "aligned" with consensus if:
```python
vote_agrees = (vote_value > 0.5 and consensus_is_true) or
              (vote_value < 0.5 and consensus_is_false)
```

Where:
- `consensus_is_true` = gradient > 0.7
- `consensus_is_false` = gradient < 0.3

---

## Tier System

Tiers are determined solely by reputation score.

### Tier Thresholds

| Tier | Reputation Range | Description |
|------|------------------|-------------|
| **NEW** | 0 - 99 | New participants |
| **ESTABLISHED** | 100 - 999 | Proven contributors |
| **TRUSTED** | 1,000+ | Highly reliable agents |

### Tier Promotion

Tier promotion happens automatically when reputation crosses thresholds:

```python
def determine_tier(reputation: float) -> AgentTier:
    if reputation >= 1000:
        return AgentTier.TRUSTED
    elif reputation >= 100:
        return AgentTier.ESTABLISHED
    else:
        return AgentTier.NEW
```

Note: Tier demotion also happens automatically if reputation falls below thresholds.

---

## Rate Limits

Rate limits control how many actions an agent can perform per day, based on their tier.

### Daily Limits

| Tier | Evidence/Day | Votes/Day |
|------|--------------|-----------|
| **NEW** | 3 | 20 |
| **ESTABLISHED** | 20 | 100 |
| **TRUSTED** | 10,000* | 500 |

*Effectively unlimited for practical purposes

### Rationale

- **Spam prevention**: New users can't flood the system
- **Quality incentive**: Good contributions unlock more capacity
- **Scale with trust**: Proven agents can contribute more

---

## Learning Score

The learning score measures an agent's ability to make accurate judgments over time, accounting for consistency and improvement.

### Formula

```
L = 0.50 × accuracy + 0.25 × consistency + 0.25 × trajectory
```

Where:
- `L` = learning score (0.0 to 1.0)
- `accuracy` = correct_resolved_votes / total_resolved_votes
- `consistency` = consistency score (0.0 to 1.0)
- `trajectory` = improvement trajectory (0.0 to 1.0)

### Default Value

New agents with no resolved votes start with a learning score of **0.5**.

### Accuracy Component (50%)

Simple accuracy rate on claims that have reached consensus:

```python
accuracy = correct_resolved_votes / total_resolved_votes
```

A vote is "correct" if:
- Vote > 0.5 and claim gradient > 0.8 (voted TRUE, claim resolved TRUE)
- Vote < 0.5 and claim gradient < 0.2 (voted FALSE, claim resolved FALSE)

### Consistency Component (25%)

Measures variance in accuracy across time windows (30-day periods).

```python
# Calculate accuracy for each 30-day window
windows = [
    (now - 30d, now),
    (now - 60d, now - 30d),
    (now - 90d, now - 60d),
]

# Calculate variance
variance = Σ(accuracy_i - mean_accuracy)² / n

# Convert to consistency score (lower variance = higher score)
consistency = 1.0 - min(1.0, variance × 4)
```

Maximum variance for accuracy values is 0.25 (alternating between 0 and 1), so multiplying by 4 normalizes to 0-1 range.

### Trajectory Component (25%)

Measures improvement trend using linear regression on accuracy over time.

```python
# Calculate accuracy for 3 periods
periods = [
    (now - 90d, now - 60d),  # oldest
    (now - 60d, now - 30d),  # middle
    (now - 30d, now),        # newest
]

# Linear regression slope
slope = (n × Σ(i × accuracy_i) - Σ(i) × Σ(accuracy_i)) /
        (n × Σ(i²) - (Σ(i))²)

# Convert slope to score
trajectory = 0.5 + slope  # Clamped to [0, 1]
```

- Positive slope (improving) → trajectory > 0.5
- Negative slope (declining) → trajectory < 0.5
- Flat (stable) → trajectory ≈ 0.5

---

## Expertise Tracking

Agents build expertise in specific topics (tags) based on their voting accuracy.

### Accuracy in Tag

Uses an **exponential moving average** to weight recent results more heavily:

```python
new_accuracy = old_accuracy × 0.9 + current_result × 0.1
```

Where `current_result` is 1.0 for correct, 0.0 for incorrect.

### Properties

| Property | Value |
|----------|-------|
| Weight for old accuracy | 0.9 (90%) |
| Weight for new result | 0.1 (10%) |
| Minimum engagements to display | 3 |

### Rationale

- **Recency bias**: Recent performance matters more than historical
- **Stability**: Single wrong answer doesn't tank expertise
- **Minimum threshold**: Prevents expertise claims from minimal participation

---

## Summary of Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| Default gradient | 0.5 | gradient_service.py |
| Minimum vote weight | 0.1 | gradient_service.py |
| Consensus TRUE threshold | > 0.7 | reputation_service.py |
| Consensus FALSE threshold | < 0.3 | reputation_service.py |
| Evidence upvote delta | +5.0 | reputation_service.py |
| Evidence downvote delta | -3.0 | reputation_service.py |
| Vote aligned delta | +1.0 | reputation_service.py |
| Vote opposed delta | -0.5 | reputation_service.py |
| NEW tier max | 99 | reputation_service.py |
| ESTABLISHED tier min | 100 | reputation_service.py |
| TRUSTED tier min | 1000 | reputation_service.py |
| Learning score accuracy weight | 0.50 | learning_score_service.py |
| Learning score consistency weight | 0.25 | learning_score_service.py |
| Learning score trajectory weight | 0.25 | learning_score_service.py |
| Expertise EMA decay | 0.9 | learning_score_service.py |
