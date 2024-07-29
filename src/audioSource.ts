type AudioSourceState = "PLAYING" | "PAUSED" | "STOPPED";

export default class AudioSource {
  private _context: AudioContext;
  private _buffer: AudioBuffer;
  private _bufferSourceNode: AudioBufferSourceNode;
  private _gainNode: GainNode;
  private _playHead: number = 0;
  public state: AudioSourceState = "STOPPED";
  constructor({
    context,
    buffer,
    gainNode,
  }: {
    context: AudioContext;
    buffer: AudioBuffer;
    gainNode: GainNode;
  }) {
    this._buffer = buffer;
    this._context = context;
    this._gainNode = gainNode;
    this._bufferSourceNode = this.createBufferSourceNode(buffer);
  }

  private createBufferSourceNode(buffer: AudioBuffer): AudioBufferSourceNode {
    return new AudioBufferSourceNode(this._context, {
      buffer,
    });
  }

  load(buffer: AudioBuffer): AudioBufferSourceNode {
    this._buffer = buffer;
    this._bufferSourceNode = this.createBufferSourceNode(buffer);
    this._bufferSourceNode
      .connect(this._gainNode)
      .connect(this._context.destination);
    this._bufferSourceNode.addEventListener("ended", () => {
      if (this.state === "PLAYING") {
        this._playHead = 0;
      }
      this.state = "STOPPED";
    });
    return this._bufferSourceNode;
  }

  play() {
    if (this.state === "PLAYING") {
      console.log("here");
      // we're already playing
      return;
    }

    // create a new audio buffer source node with the current buffer
    const bufferSourceNode = this.load(this._buffer);
    // start playing at the playhead
    bufferSourceNode.start(0, this._playHead);
    // console.log(this._bufferSourceNode);
    this.state = "PLAYING";
  }

  resume() {
    this.play();
  }

  pause() {
    if (this.state === "PAUSED") {
      return;
    }
    if (this.state === "PLAYING") {
      // get the current time at the time we pause
      // we use this value if playback resumes
      this._playHead = this._bufferSourceNode.context.currentTime;
    }
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
    this.state = "PAUSED";
  }

  stop() {
    if (this.state === "STOPPED") {
      // we're already stopped
      return;
    }
    // reset the start time
    this._playHead = 0;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
    this.state = "STOPPED";
  }
}
