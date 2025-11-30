#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { AIPasswordValidatorStack } from '../lib/ai-password-validator-stack';
import { QuantumImageProcessorStack } from '../lib/quantum-image-processor-stack';
import { SockMatcherAgentsStack } from '../lib/sock-matcher-agents-stack';

const app = new cdk.App();
new MainStack(app, 'MainStack');
new QuantumImageProcessorStack(app, 'QuantumImageProcessorStack', {
  env: { region: 'us-west-2' },
  cognitoUserPoolArn: 'arn:aws:cognito-idp:us-west-2:831926593673:userpool/us-west-2_R5d1sC0Tn',
});
new AIPasswordValidatorStack(app, 'AIPasswordValidatorStack', {});
new SockMatcherAgentsStack(app, 'SockMatcherAgentsStack', {
  env: { region: 'us-west-2' },
  description: 'Magnificently over-engineered sock matching with AI agent committee',
});
