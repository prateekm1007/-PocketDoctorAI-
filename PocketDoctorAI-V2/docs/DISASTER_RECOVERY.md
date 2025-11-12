# 🛡️ PocketDoctor AI - Disaster Recovery Plan (V2)
**RTO:** < 4 hours | **RPO:** < 1 hour | **Availability:** 99.9%

## Backups
- Firestore: Cloud Scheduler daily export -> GCS bucket with 30/90/365 retention.
- S3: Cross-Region Replication + Lifecycle to Glacier.

## Restore
- Firestore: `gcloud firestore import gs://bucket/path/YYYY-MM-DD`
- S3: Promote replica, update envs, invalidate CloudFront.

## DR Drills
- Quarterly staging restore simulation; log duration & issues.

## Runbooks
- Region outage: switch Route53 to standby ALB in secondary region.
- Budget runaway: disable nonessential workers, reduce concurrency, enable circuit breakers.
