import * as assert from 'assert';
import { only, skip, slow, suite, test, timeout } from 'mocha-typescript';

import { AutoRest } from '../lib/autorest-core';
import { RealFileSystem } from '@azure-tools/datastore';
import { Channel, Message } from '../lib/message';
import { CreateFolderUri, ResolveUri } from '@azure-tools/uri';
import { PumpMessagesToConsole } from './test-utility';

@suite class EndToEnd {
  @test async 'network full game'() {
    const autoRest = new AutoRest(new RealFileSystem());
    // PumpMessagesToConsole(autoRest);
    autoRest.AddConfiguration({
      'input-file': [
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/applicationGateway.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/checkDnsAvailability.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/expressRouteCircuit.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/loadBalancer.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/network.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/networkInterface.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/networkSecurityGroup.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/networkWatcher.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/publicIpAddress.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/routeFilter.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/routeTable.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/serviceCommunity.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/usage.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/virtualNetwork.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/virtualNetworkGateway.json',
        'https://github.com/Azure/azure-rest-api-specs/blob/master/specification/network/resource-manager/Microsoft.Network/stable/2017-03-01/vmssNetworkInterface.json']
    });

    autoRest.AddConfiguration({
      'override-info': {
        title: 'Network'
      }
    });

    // TODO: generate for all, probe results

    const success = await autoRest.Process().finish;
    assert.strictEqual(success, true);
  }

  @test async 'other configuration scenario'() {
    const autoRest = new AutoRest(new RealFileSystem(), ResolveUri(CreateFolderUri(__dirname), '../../test/resources/literate-example/readme-complicated.md'));
    // PumpMessagesToConsole(autoRest);

    const config = await autoRest.view;
    assert.strictEqual(config['shouldwork'], true);

  }

  // todo: skipping because testing is broken?
  @test @skip async 'complicated configuration scenario'() {
    const autoRest = new AutoRest(new RealFileSystem(), ResolveUri(CreateFolderUri(__dirname), '../../test/resources/literate-example/readme-complicated.md'));
    // PumpMessagesToConsole(autoRest);
    autoRest.AddConfiguration({
      'cmd-line-true': true,
      'cmd-line-false': false,
      'cmd-line-complex': {
        'true': true,
        'false': false
      }
    });

    const config = await autoRest.view;
    assert.strictEqual(config.InputFileUris.length, 1);

    const messages: Array<Message> = [];

    autoRest.Message.Subscribe((_, m) => { if (m.Channel === Channel.Warning) { messages.push(m); } });
    assert.equal(await autoRest.Process().finish, true);
    assert.notEqual(messages.length, 0);
  }
  // testing end-to-end for non-arm type validation rules. Since all validation rules are currently defaulted to
  // ARM, non-ARM documents should show 0 validation messages
  // TODO: fix this test when validation rules are properly categorized
  @test @skip async 'non-arm type spec testing'() {
    const autoRest = new AutoRest(new RealFileSystem(), ResolveUri(CreateFolderUri(__dirname), '../../test/resources/validation-options/readme.md'));
    autoRest.AddConfiguration({
      'openapi-type': 'default',
      'azure-validator': true
    });

    const config = await autoRest.view;
    const messages: Array<Message> = [];

    autoRest.Message.Subscribe((_, m) => { messages.push(m); });
    assert.equal(await autoRest.Process().finish, true);
    assert.notEqual(messages.length, 0);
    // flag any fatal errors
    assert.equal(messages.filter(m => m.Channel === Channel.Fatal).length, 0);
  }

  // todo: skipping because testing is broken?
  @test @skip async 'arm type spec testing'() {
    const autoRest = new AutoRest(new RealFileSystem(), ResolveUri(CreateFolderUri(__dirname), '../../test/resources/validation-options/readme.md'));
    autoRest.AddConfiguration({
      'openapi-type': 'arm',
      'azure-validator': true
    });

    const config = await autoRest.view;

    const messages: Array<Message> = [];

    autoRest.Message.Subscribe((_, m) => { messages.push(m); });
    // PumpMessagesToConsole(autoRest);
    assert.equal(await autoRest.Process().finish, true);
    // flag any fatal errors
    assert.equal(messages.filter(m => m.Channel === Channel.Fatal).length, 0);
    assert.notEqual(messages.length, 0);
  }
}
