#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { QuantumImageProcessorStack } from '../lib/quantum-image-processor-stack';

const app = new cdk.App();
new MainStack(app, 'MainStack');
new QuantumImageProcessorStack(app, 'QuantumImageProcessorStack', {
  env: { region: 'us-east-1' },
});
