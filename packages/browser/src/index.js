import { snapdom } from "@zumer/snapdom";
import {
  Muxer,
  FileSystemWritableFileStreamTarget,
  StreamTarget,
} from "mp4-muxer";
import { AVC } from "media-codecs";
import { observeParentSize } from "./lib/observe-parent-size";
import { scaleToFit } from "./lib/utils";

async function seek({ time, timeline, container }) {
  console.log(`seek: ${time}`);
  timeline.seek(time);
  // todo: seek to all elements as well
}

function setup({ gsap, timeline, container, params }) {
  console.log("setup");

  const isPuppeteer = window.isPuppeteer ?? false;

  if (isPuppeteer) {
    console.log("setup called from puppeteer");
  }

  // set fps
  gsap.ticker.fps(params.fps ?? 30);

  // override video width from params
  if (params.width) {
    container.style.width = `${params.width}px`;
  }

  // override video width from params
  if (params.height) {
    container.style.height = `${params.height}px`;
  }

  // resize container when parent changes
  const stopObserveParentSize = observeParentSize(
    container,
    ({ width, height }) => {
      if (isPuppeteer) return;

      const { offsetWidth: cw, offsetHeight: ch } = container;
      const scale = scaleToFit(cw, ch, width, height);
      const [w, h] = [cw * scale, ch * scale];
      const [tx, ty] = [(width - w) / 2, (height - h) / 2];

      Object.assign(container.style, {
        transformOrigin: "top left",
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      });
    }
  );

  window.exportVideo = async () => {
    let result;
    if (isPuppeteer) {
      result = await exportVideo({
        puppeteer: true,
        timeline,
        container,
        params,
      });
    } else {
      // store current transform styles
      const prevTransform = container.style.transform;
      const prevTransformOrigin = container.style.transformOrigin;

      // clear transforms
      container.style.transform = "";
      container.style.transformOrigin = "";

      try {
        result = await exportVideo({
          puppeteer: false,
          timeline,
          container,
          params,
        });
      } catch (err) {
      } finally {
        // restore original transforms
        container.style.transform = prevTransform;
        container.style.transformOrigin = prevTransformOrigin;
      }

      return result;
    }
  };

  // create export function for browser
  document
    .getElementById("export")
    ?.addEventListener("click", window.exportVideo);

  // listen to export-video command from parent (playground)
  window.addEventListener("message", async function (event) {
    if (event?.data?.type === "export-video") {
      await window.exportVideo();
    }
  });

  // make sure gs devtools stays on top of the video
  document.querySelector(".gs-dev-tools")?.style.setProperty("z-index", "1000");

  console.log("setup ready");

  // return cleanup function
  return () => {
    stopObserveParentSize();
  };
}

async function exportVideo({ puppeteer = false, timeline, container, params }) {
  // pause and rewind
  timeline.pause();

  await seek({ time: 0, timeline, container });

  let target, fileStream;

  if (puppeteer) {
    target = new StreamTarget({
      onData: async (chunk, position) => {
        // see puppeteer
        // @ts-ignore
        await window.writeChunk(Array.from(chunk), position);
      },
    });
  } else {
    // show file picker
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `video-${Date.now()}.mp4`,
      types: [
        {
          description: "Video File",
          accept: { "video/mp4": [".mp4"] },
        },
      ],
    });
    fileStream = await fileHandle.createWritable();
    target = new FileSystemWritableFileStreamTarget(fileStream);
  }

  const fps = params.fps ?? 30;
  const frames = Math.round(timeline.duration() * fps) + 1;

  const width = 1920;
  const height = 1080;
  const bitrate = 6_000_000;

  const muxerOptions = {
    fastStart: false,
    target,
    video: {
      codec: "avc",
      width: width,
      height: height,
    },
    firstTimestampBehavior: "offset",
  };

  const muxer = new Muxer(muxerOptions);

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => console.error(e),
  });

  // get video codec
  const videoCodec = AVC.getCodec({ profile: "Main", level: "5.2" });

  // create video encoder config
  const videoEncoderConfig = {
    codec: videoCodec,
    width: width,
    height: height,
    bitrate: bitrate,
    contentHint: "detail",
  };

  // test video encoder config
  const videoConfigTest = await VideoEncoder.isConfigSupported(
    videoEncoderConfig
  );

  console.log("video encoder config supported?", videoConfigTest);

  videoEncoder.configure(videoEncoderConfig);

  let frame = 0;
  while (frame < frames) {
    const time = frame / fps;

    // seek timeline to his time/frame
    await seek({ time, timeline, container });

    // clone the container and add it to a "hidden" ghost container in the body
    const clone = container.cloneNode(true);
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
    ghost.appendChild(clone);
    document.body.appendChild(ghost);

    const canvas = await snapdom.toCanvas(clone, {
      fast: true,
      scale: 1,
    });

    // discard the ghost container
    ghost.remove();

    // grab the canvas into a frame
    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round(time * 1_000_000), // microseconds,
    });

    // keyframe first and every 5s
    videoEncoder.encode(videoFrame, {
      keyFrame: frame === 0 || frame % Math.round(fps * 5) === 0,
    });

    videoFrame.close();

    // flush video encoder every 10 frames
    if (frame % 10 === 0) {
      await videoEncoder.flush();
    }

    frame++;
  }

  await videoEncoder.flush();
  muxer.finalize();

  await fileStream?.close();

  console.log("export done");

  return;
}

export { exportVideo, seek, setup };
