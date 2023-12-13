import debounce from "lodash-es/debounce";
import settings from "./settings";
import loadFont from "./utils/loadFont";

// 캔버스 만들때 사용되는 변수
let {
  canvasHeight,
  canvasWidth,
  fontSize,
  horizontalTilt,
  textBaseLine,
  graphOffset,
  paddingX,
  hollowPath,
} = settings;
let font = `${fontSize}px RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`;

// 업스케일링 조작시 캔버스 다시 셋팅
const resetOe = () => {
  const step = <HTMLInputElement>document.getElementById("imageStep");

  if (step && step.value) {
    let v = parseInt(step.value);

    if (v < 1 || v > 4) v = 1;

    canvasHeight = settings.canvasHeight * v;
    canvasWidth = settings.canvasWidth * v;
    fontSize = settings.fontSize * v;
    horizontalTilt = settings.horizontalTilt;
    textBaseLine = settings.textBaseLine;
    graphOffset = {
      X: settings.graphOffset.X * v,
      Y: settings.graphOffset.Y * v,
    };
    paddingX = settings.paddingX * v;
    hollowPath = settings.hollowPath;
  }

  font = `${fontSize}px RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`;
};

export default class LogoCanvas {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public textL = "Blue";
  public textR = "Archive";
  private textMetricsL: TextMetrics | null = null;
  private textMetricsR: TextMetrics | null = null;
  private canvasWidthL = canvasWidth / 2;
  private canvasWidthR = canvasWidth / 2;
  private textWidthL = 0;
  private textWidthR = 0;
  private graphOffset = graphOffset;
  private transparentBg = false;
  constructor() {
    this.canvas = document.querySelector("#canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.canvas.height = canvasHeight;
    this.canvas.width = canvasWidth;
    this.bindEvent();
  }
  async draw() {
    // 색상 설정값 있는 요소 값 불러오기

    const colorR = <HTMLInputElement>document.querySelector("#textColorR");
    const colorL = <HTMLInputElement>document.querySelector("#textColorL");
    let colorValueR = "#2B2B2B";
    let colorValueL = "#128AFA";
    if (colorR.value.length === 7 && colorR.value.includes("#")) {
      colorValueR = colorR.value;
    }
    if (colorL.value.length === 7 && colorL.value.includes("#")) {
      colorValueL = colorL.value;
    }
    console.log("colorValueR : " + colorValueR);
    console.log("colorValueL : " + colorValueL);

    const loading = document.querySelector("#loading")!;
    loading.classList.remove("hidden");
    const c = this.ctx;
    //predict canvas width
    await loadFont(this.textL + this.textR);
    loading.classList.add("hidden");
    c.font = font;
    this.textMetricsL = c.measureText(this.textL);
    this.textMetricsR = c.measureText(this.textR);
    this.setWidth();
    //clear canvas
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //Background
    if (!this.transparentBg) {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    //blue text -> halo -> black text -> cross
    c.font = font;
    c.fillStyle = colorValueL;
    c.textAlign = "end";
    c.setTransform(1, 0, horizontalTilt, 1, 0, 0);
    c.fillText(
      this.textL,
      this.canvasWidthL,
      this.canvas.height * textBaseLine
    );
    c.resetTransform(); //restore don't work

    /* 크기 변경시 헤일로 위치 틀어지는것 수정 */
    c.drawImage(
      window.halo,
      this.canvasWidthL - this.canvas.height / 2 + graphOffset.X,
      this.graphOffset.Y,
      canvasHeight,
      canvasHeight
    );
    c.fillStyle = colorValueR;
    c.textAlign = "start";
    if (this.transparentBg) {
      c.globalCompositeOperation = "destination-out";
    }
    c.strokeStyle = "white";
    c.lineWidth = 12;
    c.setTransform(1, 0, horizontalTilt, 1, 0, 0);
    c.strokeText(
      this.textR,
      this.canvasWidthL,
      this.canvas.height * textBaseLine
    );
    c.globalCompositeOperation = "source-over";
    c.fillText(
      this.textR,
      this.canvasWidthL,
      this.canvas.height * textBaseLine
    );
    c.resetTransform();
    const graph = {
      X: this.canvasWidthL - this.canvas.height / 2 + graphOffset.X,
      Y: this.graphOffset.Y,
    };
    c.beginPath();
    c.moveTo(
      graph.X + (hollowPath[0][0] / 500) * canvasHeight,
      graph.Y + (hollowPath[0][1] / 500) * canvasHeight
    );
    for (let i = 1; i < 4; i++) {
      c.lineTo(
        graph.X + (hollowPath[i][0] / 500) * canvasHeight,
        graph.Y + (hollowPath[i][1] / 500) * canvasHeight
      );
    }
    c.closePath();
    if (this.transparentBg) {
      c.globalCompositeOperation = "destination-out";
    }
    c.fillStyle = "white";
    c.fill();
    c.globalCompositeOperation = "source-over";
    c.drawImage(
      window.cross,
      this.canvasWidthL - this.canvas.height / 2 + graphOffset.X,
      this.graphOffset.Y,
      canvasHeight,
      canvasHeight
    );
  }
  bindEvent() {
    const process = (id: "textL" | "textR", el: HTMLInputElement) => {
      this[id] = el.value;
      this.draw();
    };
    for (const t of ["textL", "textR"]) {
      const id = t as "textL" | "textR";
      const el = document.getElementById(id)! as HTMLInputElement;
      el.addEventListener("compositionstart", () =>
        el.setAttribute("composing", "")
      );
      el.addEventListener("compositionend", () => {
        process(id, el);
        el.removeAttribute("composing");
      });
      el.addEventListener(
        "input",
        debounce(() => {
          if (el.hasAttribute("composing")) {
            return;
          }
          process(id, el);
        }, 300)
      );
    }

    // 색상 설정 리스너
    for (const r of ["textColorL", "textColorR"]) {
      const a = r,
        o = <HTMLInputElement>document.getElementById(a);

      o.addEventListener("input", () => {
        if (o.value.length === 7 && o.value.includes("#")) {
          console.log("OK");
          this.draw();
          // const d = document.getElementById("textL");
          // e("textL", d);
        }
      });
    }

    //이미지 크기 리스너
    const stepEl = <HTMLInputElement>document.getElementById("imageStep");

    stepEl.addEventListener("change", () => {
      if (parseInt(stepEl.value) >= 1 && parseInt(stepEl.value) <= 4) {
        resetOe();
        // 헤일로 위치 값도 같이 바꾸기
        const grx = <HTMLInputElement>document.querySelector("#graphX");
        const gry = <HTMLInputElement>document.querySelector("#graphY");
        grx.value = graphOffset.X.toString();
        gry.value = graphOffset.Y.toString();
        this.draw();
      }
    });

    document
      .querySelector("#save")!
      .addEventListener("click", () => this.saveImg());
    document
      .querySelector("#copy")!
      .addEventListener("click", () => this.copyImg());
    const tSwitch = document.querySelector("#transparent")! as HTMLInputElement;
    tSwitch.addEventListener("change", () => {
      this.transparentBg = tSwitch.checked;
      this.draw();
    });

    // 헤일로 위치 변경 리스너
    const gx = document.querySelector("#graphX")! as HTMLInputElement;
    const gy = document.querySelector("#graphY")! as HTMLInputElement;
    gx.addEventListener("input", () => {
      this.graphOffset.X = parseInt(gx.value);
      this.draw();
    });
    gy.addEventListener("input", () => {
      this.graphOffset.Y = parseInt(gy.value);
      this.draw();
    });
  }

  // 이미지 캔버스 크기 조절
  setWidth() {
    this.textWidthL =
      this.textMetricsL!.width -
      (textBaseLine * canvasHeight +
        this.textMetricsL!.fontBoundingBoxDescent) *
        horizontalTilt;
    this.textWidthR =
      this.textMetricsR!.width +
      (textBaseLine * canvasHeight - this.textMetricsR!.fontBoundingBoxAscent) *
        horizontalTilt;
    //extend canvas
    if (this.textWidthL + paddingX > canvasWidth / 2) {
      this.canvasWidthL = this.textWidthL + paddingX;
    } else {
      this.canvasWidthL = canvasWidth / 2;
    }
    if (this.textWidthR + paddingX > canvasWidth / 2) {
      this.canvasWidthR = this.textWidthR + paddingX;
    } else {
      this.canvasWidthR = canvasWidth / 2;
    }
    this.canvas.width = this.canvasWidthL + this.canvasWidthR;
    // 높이 조절 추가
    this.canvas.height = canvasHeight;
  }
  generateImg() {
    let outputCanvas: HTMLCanvasElement;
    if (
      this.textWidthL + paddingX < canvasWidth / 2 ||
      this.textWidthR + paddingX < canvasWidth / 2
    ) {
      outputCanvas = document.createElement("canvas");
      outputCanvas.width = this.textWidthL + this.textWidthR + paddingX * 2;
      outputCanvas.height = this.canvas.height;
      const ctx = outputCanvas.getContext("2d")!;
      ctx.drawImage(
        this.canvas,
        canvasWidth / 2 - this.textWidthL - paddingX,
        0,
        this.textWidthL + this.textWidthR + paddingX * 2,
        this.canvas.height,
        0,
        0,
        this.textWidthL + this.textWidthR + paddingX * 2,
        this.canvas.height
      );
    } else {
      outputCanvas = this.canvas;
    }
    return new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject();
        }
      });
    });
  }
  saveImg() {
    this.generateImg().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.textL}${this.textR}_ba-style@nulla.top.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  async copyImg() {
    const blob = await this.generateImg();
    const cp = [new ClipboardItem({ "image/png": blob })];
    navigator.clipboard
      .write(cp)
      .then(() => {
        console.log("image copied");
        const msg = document.querySelector(
          "#message-switch"
        ) as HTMLInputElement;
        msg.checked = true;
        setTimeout(() => (msg.checked = false), 2000);
      })
      .catch((e) => console.error("can't copy", e));
  }
}
