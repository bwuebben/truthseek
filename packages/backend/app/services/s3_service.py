"""
S3 service for file uploads and downloads.

Handles presigned URL generation for secure direct uploads/downloads.
"""

import mimetypes
import uuid
from datetime import UTC, datetime

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings


# Allowed file types and max sizes
ALLOWED_CONTENT_TYPES = {
    # Documents
    "application/pdf": 50 * 1024 * 1024,  # 50MB
    "text/plain": 10 * 1024 * 1024,  # 10MB
    "text/markdown": 10 * 1024 * 1024,
    "text/csv": 50 * 1024 * 1024,
    # Images
    "image/jpeg": 10 * 1024 * 1024,
    "image/png": 10 * 1024 * 1024,
    "image/gif": 10 * 1024 * 1024,
    "image/webp": 10 * 1024 * 1024,
    # Code/data
    "application/json": 50 * 1024 * 1024,
    "application/xml": 50 * 1024 * 1024,
    "application/zip": 100 * 1024 * 1024,  # 100MB
    "application/gzip": 100 * 1024 * 1024,
}

DEFAULT_MAX_SIZE = 10 * 1024 * 1024  # 10MB default


class S3ServiceError(Exception):
    """Custom exception for S3 service errors."""
    pass


class S3Service:
    """
    Service for managing file uploads to S3.

    Uses presigned URLs for secure direct uploads from the client.
    """

    def __init__(self):
        self.bucket_name = settings.s3_bucket_name
        self.region = settings.aws_region

        # Configure S3 client
        config = Config(
            signature_version='s3v4',
            region_name=self.region,
        )

        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=self.region,
                config=config,
            )
        else:
            # Use IAM role or environment credentials
            self.s3_client = boto3.client(
                's3',
                region_name=self.region,
                config=config,
            )

    def generate_upload_url(
        self,
        file_name: str,
        content_type: str,
        agent_id: str,
        claim_id: str,
        expires_in: int = 3600,
    ) -> dict:
        """
        Generate a presigned URL for uploading a file.

        Args:
            file_name: Original file name
            content_type: MIME type of the file
            agent_id: ID of the uploading agent
            claim_id: ID of the claim this evidence is for
            expires_in: URL expiration in seconds (default 1 hour)

        Returns:
            dict with upload_url, file_key, and expires_in
        """
        # Validate content type
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise S3ServiceError(f"Content type '{content_type}' is not allowed")

        # Generate unique file key
        timestamp = datetime.now(UTC).strftime('%Y/%m/%d')
        unique_id = uuid.uuid4().hex[:12]
        safe_filename = self._sanitize_filename(file_name)
        file_key = f"evidence/{timestamp}/{agent_id}/{claim_id}/{unique_id}_{safe_filename}"

        try:
            # Generate presigned POST (more secure than presigned PUT)
            presigned_post = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=file_key,
                Fields={
                    'Content-Type': content_type,
                },
                Conditions=[
                    {'Content-Type': content_type},
                    ['content-length-range', 1, ALLOWED_CONTENT_TYPES.get(content_type, DEFAULT_MAX_SIZE)],
                ],
                ExpiresIn=expires_in,
            )

            return {
                'upload_url': presigned_post['url'],
                'fields': presigned_post['fields'],
                'file_key': file_key,
                'expires_in': expires_in,
                'max_size': ALLOWED_CONTENT_TYPES.get(content_type, DEFAULT_MAX_SIZE),
            }

        except ClientError as e:
            raise S3ServiceError(f"Failed to generate upload URL: {e}")

    def generate_download_url(
        self,
        file_key: str,
        expires_in: int = 3600,
        file_name: str | None = None,
    ) -> str:
        """
        Generate a presigned URL for downloading a file.

        Args:
            file_key: S3 object key
            expires_in: URL expiration in seconds (default 1 hour)
            file_name: Optional filename for Content-Disposition header

        Returns:
            Presigned download URL
        """
        try:
            params = {
                'Bucket': self.bucket_name,
                'Key': file_key,
            }

            if file_name:
                params['ResponseContentDisposition'] = f'attachment; filename="{file_name}"'

            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires_in,
            )
            return url

        except ClientError as e:
            raise S3ServiceError(f"Failed to generate download URL: {e}")

    def delete_file(self, file_key: str) -> bool:
        """
        Delete a file from S3.

        Args:
            file_key: S3 object key

        Returns:
            True if deleted successfully
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key,
            )
            return True
        except ClientError as e:
            raise S3ServiceError(f"Failed to delete file: {e}")

    def file_exists(self, file_key: str) -> bool:
        """
        Check if a file exists in S3.

        Args:
            file_key: S3 object key

        Returns:
            True if file exists
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_key,
            )
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise S3ServiceError(f"Failed to check file existence: {e}")

    def get_file_info(self, file_key: str) -> dict | None:
        """
        Get metadata about a file in S3.

        Args:
            file_key: S3 object key

        Returns:
            dict with file info or None if not found
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_key,
            )
            return {
                'size': response['ContentLength'],
                'content_type': response['ContentType'],
                'last_modified': response['LastModified'],
                'etag': response['ETag'].strip('"'),
            }
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return None
            raise S3ServiceError(f"Failed to get file info: {e}")

    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize a filename for safe storage.

        Removes path components and special characters.
        """
        import re
        # Get just the filename, no path
        filename = filename.split('/')[-1].split('\\')[-1]
        # Remove special characters, keep alphanumeric, dots, hyphens, underscores
        filename = re.sub(r'[^\w.\-]', '_', filename)
        # Limit length
        if len(filename) > 100:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:95] + ('.' + ext if ext else '')
        return filename


# Singleton instance
s3_service = S3Service()
