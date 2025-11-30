#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';

const app = new cdk.App();
new MainStack(app, 'MainStack', {
    // Optional: specify environment
    // env: { account: '123456789012', region: 'us-east-1' }
});
