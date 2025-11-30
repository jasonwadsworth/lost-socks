import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";
import * as path from "path";

export class MainStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const domainName = "solemate.cloud";
        const hostedZoneId = "Z00212753QAU2AHE2CTFX";

        // Import existing hosted zone
        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "SoleMateZone", {
            hostedZoneId: hostedZoneId,
            zoneName: domainName,
        });

        // Import existing SSL certificate for CloudFront (us-east-1)
        const certificate = acm.Certificate.fromCertificateArn(
            this,
            "SoleMateCertificate",
            `arn:aws:acm:us-east-1:${this.account}:certificate/bab7f128-91bf-43dd-92e1-ef4dd5b287b8`
        );

        // S3 bucket for hosting the frontend
        const websiteBucket = new s3.Bucket(this, "LostSocksWebsite", {
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        // CloudFront distribution with custom domain
        const distribution = new cloudfront.Distribution(this, "LostSocksDistribution", {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            },
            domainNames: [domainName, `www.${domainName}`],
            certificate: certificate,
            defaultRootObject: "index.html",
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                },
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                },
            ],
        });

        // Create Route53 A record for apex domain
        new route53.ARecord(this, "SoleMateARecord", {
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(distribution)
            ),
        });

        // Create Route53 A record for www subdomain
        new route53.ARecord(this, "SoleMateWwwARecord", {
            zone: hostedZone,
            recordName: "www",
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(distribution)
            ),
        });

        // Deploy frontend build to S3
        new s3deploy.BucketDeployment(this, "DeployWebsite", {
            sources: [s3deploy.Source.asset(path.join(__dirname, "../frontend/dist"))],
            destinationBucket: websiteBucket,
            distribution,
            distributionPaths: ["/*"],
        });

        // Outputs
        new cdk.CfnOutput(this, "WebsiteURL", {
            value: `https://${domainName}`,
            description: "SoleMate Website URL",
        });

        new cdk.CfnOutput(this, "CloudFrontURL", {
            value: `https://${distribution.distributionDomainName}`,
            description: "CloudFront Distribution URL",
        });

        new cdk.CfnOutput(this, "DistributionId", {
            value: distribution.distributionId,
            description: "CloudFront Distribution ID",
        });
    }
}
