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
	private _trackList = new Tracklist({ trackLimit: 3 })
	private _bufferSource: AudioBufferSourceNode | undefined
	private _volume: Volume | undefined = undefined
	private _pausedTime: number = -1
	public state: "PLAYING" | "PAUSED" | "STOPPED" = "STOPPED"
	get isMuted(): boolean {
		return this.volume().isMuted
	}

	get currentVolume(): number {
		return this.volume().currentVolume
	}
	private decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
		return new Promise((res, rej) => {
			this.context().decodeAudioData(
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

	private async _load(track: Track, { placement }: { placement: "FRONT" | "REAR" }) {
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
	play() {
		const currentTrack = this._trackList.currentTrack
		if (!currentTrack) {
			return
		}
		if (this.state === "PLAYING") {
			return
		}
		const context = this.context()
		if (context.state === 'suspended') {
			context.resume();
		}
		this._bufferSource = new AudioBufferSourceNode(context, {
			buffer: currentTrack.buffer,
		});
		this._bufferSource.connect(this.volume().gainNode).connect(context.destination);
		const startAt = this._pausedTime === -1 ? 0 : this._pausedTime
		this._bufferSource.start(0, startAt);
		this._bufferSource.addEventListener('ended', () => {
			this.state = "STOPPED"
		})
		this._pausedTime = -1
		this.state = "PLAYING"
	}
	pause() {
		if (this.state === "PAUSED") {
			return
		}
		if (this.state === "PLAYING") {
			this._pausedTime = this.context().currentTime
		}
		this._bufferSource?.stop();
		this.state = "PAUSED"
	}
	stop() {
		this._pausedTime = -1
		this._bufferSource?.stop();
		this.state = "STOPPED"
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