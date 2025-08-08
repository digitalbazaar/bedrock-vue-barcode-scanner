/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';
import {fileURLToPath} from 'url';
import path from 'path';
import '@bedrock/karma';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config.karma.suites['bedrock-vue-barcode-scanner'] =
  path.join('web', '**', '*.js');
config.karma.config.proxies = {
  '/': 'https://localhost:18443'
};
config.karma.config.proxyValidateSSL = false;
config.karma.config.webpack.resolve = {
  modules: [
    path.resolve(__dirname, '..', 'node_modules'),
    path.resolve(__dirname, 'node_modules')
  ]
};
config.karma.config.files.push({
  pattern: 'images/qr_code/**/*.*',
  included: false,
  served: true,
  watched: false
});
config.karma.config.files.push({
  pattern: 'images/pdf417/**/*.*',
  included: false,
  served: true,
  watched: false
});
