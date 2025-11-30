#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { AIPasswordValidatorStack } from '../lib/ai-password-validator-stack';

const app = new cdk.App();
new MainStack(app, 'MainStack', {
    // Optional: specify environment
    // env: { account: '123456789012', region: 'us-west-2' }
});

new AIPasswordValidatorStack(app, 'AIPasswordValidatorStack', {
    // Optional: specify environment
    // env: { account: '123456789012', region: 'us-west-2' }
});
