/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

declare module 'node-enocean' {
    export default function (): Enocean;

    class Enocean {
        public listen(serialPort: any): void;
        public on(arg0: string, arg1: (data: any) => void): void;
    }
}
