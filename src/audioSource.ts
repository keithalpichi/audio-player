type AudioSourceState =
  | "PLAYING"
  | "PAUSED"
  | "PAUSING"
  | "STOPPED"
  | "STOPPING"
  | "SEEKING";

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

  private setCurrentState(state: AudioSourceState) {
    this.state = state;
  }

  load(buffer: AudioBuffer): AudioBufferSourceNode {
    this._buffer = buffer;
    this._bufferSourceNode = this.createBufferSourceNode(buffer);
    this._bufferSourceNode
      .connect(this._gainNode)
      .connect(this._context.destination);
    this._bufferSourceNode.addEventListener("ended", this.ended.bind(this));
    return this._bufferSourceNode;
  }

  private ended() {
    switch (this.state) {
      case "SEEKING":
        this.play();
        break;
      case "PAUSING":
        this.setCurrentState("PAUSED");
        break;
      case "STOPPING":
        this.setCurrentState("STOPPED");
        break;
      case "PLAYING":
        this.setCurrentState("STOPPED");
        break;
      case undefined:
        break;
    }
  }

  play() {
    if (this.state === "PLAYING") {
      // we're already playing
      return;
    }
    // create a new audio buffer source node with the current buffer
    const bufferSourceNode = this.load(this._buffer);
    // start playing at the playhead
    bufferSourceNode.start(0, this._playHead);
    this.setCurrentState("PLAYING");
  }

  resume() {
    this.play();
  }

  pause() {
    if (this.state === "PAUSED" || this.state === "STOPPED") {
      return;
    }
    this.setCurrentState("PAUSING");
    this._playHead = this._context.currentTime;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
  }

  stop() {
    if (this.state === "STOPPED") {
      return;
    }
    this.setCurrentState("STOPPING");
    this._playHead = 0;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
  }

  seek(to: number) {
    if (this.state !== "PLAYING") {
      // we're not playing, return
      return;
    }
    this.setCurrentState("SEEKING");
    this._playHead = to;
    this._context.destination.disconnect();
    this._bufferSourceNode.stop();
  }
}
