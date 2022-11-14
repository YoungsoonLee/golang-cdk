import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import apiConfigMgr = require('../config/api-config');
import { InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';

export class AuthStack extends Stack {
  public readonly secretEndpoint:InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const version = this.node.tryGetContext('version');

    // Based on stack ID naming convetion
    // The first part is environment, the second part is service country code like 'kr' or 'us
    const env = id.split('-')[0];
    const country = id.split('-')[1];
    const apiConfig = apiConfigMgr.config(env, country);
    
    // manage policy for lambda function
    const mpolLambdaBasic = iam.ManagedPolicy.fromManagedPolicyArn(
      this, 
      `${id}-lambda-basic-policy`, 
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );

    const mpolLambdaXray = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      `${id}-lambda-xray-policy`,
      'arn:aws:iam::aws:policy/AWSXRayWriteOnlyAccess'
      );

    const mpolLambdaVPCAccess = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      `${id}-lambda-vpc-policy`,
      'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );

    // cloudwatch metrics and alarms
    let metricsPutPolicy = new iam.ManagedPolicy(this, `${id}-metrics-pusher`, {
      managedPolicyName: `${id}-metrics-pusher`,
      description: "Policy for pushing metrics to CloudWatch",
      statements: [
        new iam.PolicyStatement({
          actions: ["cloudwatch:PutMetricData", "cloudwatch:PutMetricAlarm"],
          effect: iam.Effect.ALLOW,
          resources: ["*"],
        }),
      ],
    });

    const mpoLambdaRDSAccess = iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        `${id}-lambda-rds-policy`,
        'arn:aws:iam::aws:policy/AmazonRDSFullAccess'
    );


    const leoBackendLambdaRole = new iam.Role(this, `${id}-lambda-role`, {
      roleName: `${id}-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    
    leoBackendLambdaRole.addManagedPolicy(mpolLambdaBasic);
    leoBackendLambdaRole.addManagedPolicy(mpolLambdaXray);
    leoBackendLambdaRole.addManagedPolicy(mpolLambdaVPCAccess);
    leoBackendLambdaRole.addManagedPolicy(mpoLambdaRDSAccess);
    leoBackendLambdaRole.addManagedPolicy(metricsPutPolicy);

    const vpc = ec2.Vpc.fromLookup(this, `${id}-vpc`, {
      vpcName: `${env}-${country}-net/vpc`,
    });

    let dateStoreSubnets = vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    });

    const lamndaAsset = new assets.Asset(this, `${id}-lambda-fn-asset`, {
      path: "../bin/auth",
    });


    const AuthBackendFn = new lambda.Function(this, `${id}-lambda-fn`, {
      functionName: `${id}-lambda-fn`,
      description: `${id}-lambda-fn ${env}-${country}`,
      code: lambda.Code.fromBucket(lamndaAsset.bucket, lamndaAsset.s3ObjectKey),
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.GO_1_X,
      handler: 'auth',
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      vpcSubnets: dateStoreSubnets,
      environment:{
        "REGION": this.region,
        "ENV": env,
        "COUNTRY": country,
        //'SECRET_NAME': db.databaseCredentialsSecret.secretName,
      },
      logRetention: logs.RetentionDays.THREE_MONTHS,
      role: leoBackendLambdaRole,
    });

    new cdk.CfnOutput(this, `${id}-auth-fn-arn`, {
      exportName: `${id}-auth-fn-arn`,
      value: AuthBackendFn.functionArn,
    });

    

    // Tagging all created resources
    let tags = new Map<string, string>();
    tags.set('env', env);
    tags.set('country', country);
    tags.set('service', 'auth');
    tags.set('stack', id);
    tags.set('App', `${id}`);
    tags.set('version', version || "default-version");

    for (let [key, value] of tags) {
        cdk.Tags.of(this).add(key, value);
    }
  }
}
