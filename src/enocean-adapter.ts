/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import Enocean from 'node-enocean';

import { Adapter, Device, Property } from 'gateway-addon';

class PushButton extends Device {
  private readonly keyCodes: { [key: number]: string } = {
    10: 'A1',
    30: 'A0',
    50: 'B1',
    70: 'B0',
  };

  constructor(adapter: Adapter, senderId: string) {
    super(adapter, `${PushButton.name}-${senderId}`);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this['@type'] = ['PushButton'];
    this.name = this.id;
    this.description = 'EnOcean push button';

    for (const keyCode in this.keyCodes) {
      const name = this.keyCodes[keyCode];
      const description = {
        '@type': 'PushedProperty',
        title: name,
        description: 'If the button is pressed',
        type: 'boolean',
        readOnly: true
      };

      this.properties.set(name, new Property(this, name, description));
    }
  }

  handle(data: any) {
    if (!data.raw) {
      console.warn('Data contains no value');
      return;
    }

    if (data.raw === '00') {
      console.log('Button up');
      for (const pair of this.properties) {
        const property = pair[1];
        property.setCachedValueAndNotify(false);
      }
      return;
    }

    const name = this.keyCodes[data.raw];

    if (name) {
      console.log(`Button ${name} down`);
      const property = this.properties.get(name);
      if (property) {
        property.setCachedValueAndNotify(true);
      } else {
        console.warn(`Unknown property ${name}`);
      }
    } else {
      console.warn(`Unknown key code ${data.raw}`);
    }
  }
}

export class EnOceanAdapter extends Adapter {
  private readonly knownDevices: { [key: string]: PushButton } = {};

  constructor(addonManager: any, manifest: any) {
    super(addonManager, EnOceanAdapter.name, manifest.name);
    addonManager.addAdapter(this);
    const serialPort = manifest.moziot.config.serialPort;

    if (!serialPort) {
      console.warn('Please specify serial port in the config');
      return;
    }

    const enocean = Enocean();

    enocean.listen(serialPort);

    enocean.on('data', (data: any) => {
      console.log(`Received ${JSON.stringify(data)}`);
      if (data.choice === 'f6') {
        const knownDevice = this.knownDevices[data.senderId];

        if (knownDevice) {
          knownDevice.handle(data);
        } else {
          console.log(`Detected new push button ${data.senderId}`);
          const device = new PushButton(this, data.senderId);
          this.knownDevices[data.senderId] = device;
          this.handleDeviceAdded(device);
        }
      } else {
        console.log(`Unknown telegram type ${data.choice}`);
      }
    });
  }
}
