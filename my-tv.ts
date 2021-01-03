import express from "express";
import { Application } from "express";
import * as bodyParser from "body-parser";
import smartcast, { Device } from "./vizio";
import * as _ from "underscore";
import * as readline from "readline";

class MyTv {
  public express: Application;
  private rl: any;
  private authToken: string = "Zzt8gjslrr";
  private firstRun: boolean = false;
  private tv!: Device;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.setupInitData();
  }

  private middleware(): void {
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  private routes(): void {
    let router = express.Router();

    router.get("/volumeDown", (req, res, next) => {
      console.log("received command");
      this.tv.control.volume.down();
      res.json({
        message: "success"
      });
    });

    router.get("/volumeUp", (req, res, next) => {
      this.tv.control.volume.up();
      res.json({
        message: "success"
      });
    });

    router.get("/toggleMute", (req, res, next) => {
      this.tv.control.volume.toggleMute();
      res.json({
        message: "success"
      });
    });

    router.get("/menu", (req, res, next) => {
      const control: any = this.tv.control;
      control.menu();
      res.json({
        message: "success"
      });
    });

    router.get("/navigateLeft", (req, res, next) => {
      const control: any = this.tv.control;
      control.navigate.left();
      res.json({
        message: "success"
      });
    });

    router.get("/navigateRight", (req, res, next) => {
      const control = this.tv.control;
      //control.navigate.right();
      control.keyCommand(3, 7);
      res.json({
        message: "success"
      });
    });

    router.get("/sendKeyCode/:one/:two", (req, res, next) => {
      const control = this.tv.control;
      control.keyCommand(+req.params.one, +req.params.two)
      console.log(req.params.one, req.params.two);
      res.json({
        message: "success"
      });
    });

    router.get("/navigateUp", (req, res, next) => {
      const control: any = this.tv.control;
      control.keyCommand(3, 8);
      res.json({
        message: "success"
      });
    });

    router.get("/navigateDown", (req, res, next) => {
      const control: any = this.tv.control;
      control.navigate.down();
      res.json({
        message: "success"
      });
    });

    router.get("/enter", (req, res, next) => {
      const control: any = this.tv.control;
      control.navigate.ok();
      res.json({
        message: "success"
      });
    });

    router.get("/getInputs", (req, res, next) => {
      var input = this.tv.input;
      input.list().then(data => {
        console.log("response: ", data);
      });
      res.json({
        message: "success"
      });
    });

    router.get("/setInput", (req, res, next) => {
      const input = this.tv.input;
      const src = req.headers.src as string;
      input.set(src).then(data => {
        console.log("response: ", data);
      });
      res.json({
        message: "success"
      });
    });

    router.get("/pause", (req, res, next) => {
      const control: any = this.tv.control;
      control.media.pause();
      res.json({
        message: "success"
      });
    });

    router.get("/forward", (req, res, next) => {
      const control: any = this.tv.control;
      control.media.seek.forward();
      res.json({
        message: "success"
      });
    });

    router.get("/back", (req, res, next) => {
      const control: any = this.tv.control;
      control.media.seek.back();
      res.json({
        message: "success"
      });
    });

    router.get("/togglePower", (req, res, next) => {
      this.tv.control.power.toggle();
      res.json({
        message: "success"
      });
    });

    router.get("/home", (req, res, next) => {
      const control: any = this.tv.control;
      control.keyCommand(4, 3);
      res.json({
        message: "success"
      });
    });

    router.get("/netflix", (req, res, next) => {
      const control = this.tv.control;
      control.app.open('netflix');
      res.json({
        message: "success"
      });
    });

    router.get("/hulu", (req, res, next) => {
      const control = this.tv.control;
      control.app.open('hulu');
      res.json({
        message: "success"
      });
    });

    router.get("/youtube", (req, res, next) => {
      const control = this.tv.control;
      control.app.open('youtube');
      res.json({
        message: "success"
      });
    });

    router.get("/amazon", (req, res, next) => {
      const control = this.tv.control;
      control.app.open('amazon');
      res.json({
        message: "success"
      });
    });

    router.get(
      "/currentMode",
      (req: express.Request, res: express.Response, next) => {
        this.tv.power.currentMode().then((d: responseObj) => {
          console.log(d);

          const data: any = _.first(d.ITEMS);
          res.set({
            "Content-Type": "application/json",
            "Content-Length": "123",
            ETag: "12345"
          });

          res.status(200).send({
            message: "success",
            power: data.VALUE
          });
        });
      }
    );

    this.express.use("/", router);
  }

  private setUpConsoleReader() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
  }
  private setupInitData() {
    this.setUpConsoleReader();
    this.discoverDevices();
  }

  private discoverDevices() {
    let deviceList: Array<IDevice> = [];
    console.log(`starting descovery...`);
    smartcast.discover(
      d => {
        if (!_.find(deviceList, { model: d.model })) {
          console.log(
            `device found : ${d.name} , IP : ${d.ip} , Model : ${d.model}`
          );
          let device: IDevice = d;
          device.type = d.name == "Living Room Display" ? "TV" : "SoundBar";
          deviceList.push(device);
          if (device.type == "TV") {
            this.registerTV(device);
          }
        }
      },
      e => {
        console.log(e);
      },
      2000
    );
  }

  private registerTV(device: IDevice) {
    console.log(
      `Registering ${device.type} : ${device.name} , IP : ${device.ip}`
    );
    this.tv = new smartcast(device.ip) as Device;
    if (this.firstRun) {
      this.tv.pairing.initiate().then(() => {
        this.rl.question("Enter PIN:", (answer: any) => {
          this.tv.pairing.pair(answer).then((response: any) => {
            console.log(response.ITEM.AUTH_TOKEN);
            this.authToken = response.ITEM.AUTH_TOKEN;
          });
          this.rl.close();
        });
      });
    } else {
      this.tv.pairing.useAuthToken(this.authToken);
      this.tv.input.current().then((data: any) => {
        console.log("TV Registed successfully: ", data);
      });
    }
  }
}
export default new MyTv().express;

export interface responseObj {
  STATUS: Object;
  ITEMS: Array<any>
  URI: string;
}

export interface IDevice extends smartcast.Discovery {
  type?: string;
}
