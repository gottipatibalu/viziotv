import * as smartcast from 'vizio-smart-cast';
import * as _ from 'underscore';
import * as readline from 'readline';

export class MyTv {

    private rl: any;
    private authToken:string = "Zni247864d";
    private firstRun:boolean = false;
    private tv:smartcast.Device;

    constructor() {
         this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
          });
    }
    private discoverDevices() {
        let deviceList: Array<IDevice> = [];
        console.log(`starting descovery...`);
        smartcast.discover(d => {
            if (!_.find(deviceList, {model : d.model})) {
                console.log(`device found : ${d.name} , IP : ${d.ip} , Model : ${d.model}`);
                let device: IDevice = d;
                device.type = d.name == "Living Room" ? "TV" : "SoundBar";
                deviceList.push(device);
                if (device.type == "TV") {
                    this.registerTV(device);
                }
            }
        } , e => {
            console.log(e);
        }, 2000);
    }

    private registerTV(device: IDevice) {
        console.log(`Registering ${device.type} : ${device.name} , IP : ${device.ip}`);
        this.tv = new smartcast(device.ip);
        if (this.firstRun){
            this.tv.pairing.initiate().then((response) => {
                this.rl.question('Enter PIN:', (answer) => {
                    this.tv.pairing.pair(answer).then((response) => {
                        console.log(response.ITEM.AUTH_TOKEN);
                        this.authToken = response.ITEM.AUTH_TOKEN;
                    });
                    this.rl.close();
                });
            });
        }else{
            this.tv.pairing.useAuthToken(this.authToken);
            this.tv.input.current().then((data) => {
                console.log('TV Registed successfully: ', data);
            });
        }
       
    }

    public init() {
        this.discoverDevices();
    }
}

export interface IDevice extends smartcast.Discovery {
    type?: string
}