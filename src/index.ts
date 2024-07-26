import { Tracklist } from "./tracklistLinkedList"
import Volume from './volume'

export type Track = {
	arrayBuffer: ArrayBuffer
	id: string
}

export type AudioPlayerTrack = Omit<Track, 'arrayBuffer'> & {
	buffer: AudioBuffer
	position: number
}

export default class AudioPlayer {
	private _context: AudioContext | undefined = undefined
	private _hasPermissions: boolean = false
	private _trackList = new Tracklist({ trackLimit: 3 })
	private _bufferSource: AudioBufferSourceNode | undefined
	private _volume: Volume | undefined = undefined
	get hasPermissions(): boolean {
		return this._hasPermissions
	}
	get initialized(): boolean {
		return Boolean(this._context) && this.hasPermissions
	}

	get isMuted(): boolean {
		return this.volume().isMuted
	}

	get currentVolume(): number {
		return this.volume().currentVolume
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
	private context(): AudioContext {
		if (!this._context) {
			this._context = new AudioContext()
		}
		return this._context
	}
	private volume(): Volume {
		if (!this._volume) {
			const context = this.context()
			this._volume = new Volume({ context })
		}
		return this._volume
	}
	async initialize() {
		this.context()
		this.volume()
		await this.requestPermissions()
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
	private async _load(track: Track, { placement }: { placement: "FRONT" | "REAR" }) {
		if (!this.initialized) {
			await this.initialize()
		}
		const buffer = await this.decodeAudioData(track.arrayBuffer)
		const audioPlayerTrack: AudioPlayerTrack = {
			buffer,
			id: track.id,
			position: 0
		}
		if (placement === "FRONT") {
			this._trackList.addToFront(audioPlayerTrack)
		} else {
			this._trackList.addToRear(audioPlayerTrack)
		}
	}
	async load(track: Track) {
		return this._load(track, { placement: "FRONT" })
	}
	async loadToRear(track: Track) {
		return this._load(track, { placement: "REAR" })
	}
	clear() {
		this._trackList.clear()
	}
	async play() {
		const currentTrack = this._trackList.currentTrack
		if (!currentTrack) {
			return
		}
		if (!this.initialized) {
			await this.initialize()
		}
		this._bufferSource = new AudioBufferSourceNode(this._context!, {
			buffer: currentTrack.buffer,
		});
		this._bufferSource.connect(this.volume().gainNode).connect(this._context!.destination);
		this._bufferSource.start();
	}
	pause() {
		const currentTrack = this._trackList.currentTrack
		if (currentTrack && this._context) {
			currentTrack.position = this._context.currentTime
		}
		this._bufferSource?.stop()
	}
	stop() {
		const currentTrack = this._trackList.currentTrack
		if (currentTrack) {
			currentTrack.position = 0 // reset track position back to zero
		}
		this._bufferSource = undefined
	}
	skipForward() {
		this._trackList.moveCurrentForward()
	}
	skipBackward() {
		this._trackList.moveCurrentBack()
	}
	mute() {
		this.volume().mute()
	}
	unmute() {
		this.volume().unmute()
	}
	setVolume(percent: number) {
		this.volume().set(percent)
	}
	maxVolume() {
		this.volume().set(1)
	}
}