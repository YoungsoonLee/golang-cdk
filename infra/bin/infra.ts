#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import {AuthStack} from '../lib/auth';

const app = new cdk.App();

// ### DEV
const devLeoWeb = new AuthStack(app, 'dev-kr-auth', {env: {account: '605546614264', region: 'ap-northeast-2'}});




app.synth();