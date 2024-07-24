export type Track = {
	arrayBuffer: ArrayBuffer
	id: string
}

type AudioPlayerTrack = Omit<Track, 'arrayBuffer'> & {
	buffer: AudioBuffer
	position: number
}

export default class AudioPlayer {
	private _context: AudioContext | undefined = undefined
	private _hasPermissions: boolean = false
	private _track: AudioPlayerTrack | undefined
	private _bufferSource: AudioBufferSourceNode | undefined
	get hasPermissions(): boolean {
		return this._hasPermissions
	}
	get initialized(): boolean {
		return Boolean(this._context) && this.hasPermissions
	}
	constructor() {
	}
	private decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
		if (!this.initialized) {
			this.initialize()
		}
		return new Promise((res, rej) => {
			this._context!.decodeAudioData(
				arrayBuffer,
				(buffer: AudioBuffer) => {
					res(buffer)
				},
				(error: DOMException) => {
					rej(error)
				}
			);
		})
	}
	async initialize() {
		if (!this._context) {
			this._context = new AudioContext()
		}
		if (!this.hasPermissions) {
			await this.requestPermissions()
		}
	}
	private async requestPermissions() {
		if (this.hasPermissions) {
			return
		}
		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (err) {
			throw err
		}
	}
	async load(track: Track) {
		if (!this.initialized) {
			await this.initialize()
		}
		const buffer = await this.decodeAudioData(track.arrayBuffer)
		const audioPlayerTrack: AudioPlayerTrack = {
			buffer,
			id: track.id,
			position: 0
		}
		this._track = audioPlayerTrack
	}
	clear() {
		this._track = undefined
	}
	async play() {
		if (!this._track) {
			return
		}
		if (!this.initialized) {
			await this.initialize()
		}
		this._bufferSource = new AudioBufferSourceNode(this._context!, {
			buffer: this._track.buffer,
		});
		this._bufferSource.connect(this._context!.destination);
		this._bufferSource.start();
	}
	pause() {
		if (this._track && this._context) {
			this._track.position = this._context.currentTime
		}
		this._bufferSource?.stop()
	}
	stop() {
		if (this._track) {
			this._track.position = 0 // reset track position back to zero
		}
		this._bufferSource = undefined
	}
	skipForward() {}
	skipBackward() {}
	mute() {}
	setVolume(amount: number) {}
	maxVolume() {}
}