export type Track = {
	arrayBuffer: ArrayBuffer
	id: string
}

type AudioPlayerTrack = Omit<Track, 'arrayBuffer'> & {
	buffer: AudioBuffer
}

export default class AudioPlayer {
	private _context: AudioContext | undefined = undefined
	private _hasPermissions: boolean = false
	private _tracks: {[key: Track['id']] : AudioPlayerTrack } = {}
	private _trackQueue: AudioPlayerTrack[] = []
	private _trackQueueLimit: number = 3
	private _trackHead: number = 0
	get hasPermissions(): boolean {
		return this._hasPermissions
	}
	constructor({ trackQueueLimit }: { trackQueueLimit: number }) {
		this._trackQueueLimit = trackQueueLimit
	}
	private addTrackToQueue(audioPlayerTrack: AudioPlayerTrack) {
		/**
		 * check if queue has reached it's limit, if so return early
		 */
		if (this.trackQueueIsFull) {
			return
		}
	}
	private removeTrackFromQueue(trackId: Track['id']) {
		this._trackQueue = this._trackQueue.filter(track => track.id !== trackId)
	}
	private decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
		if (!this._context === undefined) {
			this.createAudioContext()
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
	private get trackQueueIsFull(): boolean {
		return this._trackQueue.length === this._trackQueueLimit	
	}
	createAudioContext() {
		this._context = new AudioContext()
	}
	async requestPermissions() {
		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (err) {
			throw err
		}
	}
	async addTrack(track: Track) {
		if (!this._tracks.hasOwnProperty(track.id)) {
			const buffer = await this.decodeAudioData(track.arrayBuffer)
			const audioPlayerTrack: AudioPlayerTrack = {
				buffer,
				id: track.id
			}
			this._tracks[track.id] = audioPlayerTrack
			this.addTrackToQueue(audioPlayerTrack)
		}
	}
	removeAllTracks() {
		this._tracks = {}
		this._trackQueue = []
	}
	hasTrack(trackId: Track['id']): boolean {
		return this._tracks.hasOwnProperty(trackId)	
	}
	removeTrack(track: Track) {
		if (this._tracks.hasOwnProperty(track.id)) {
			delete this._tracks[track.id]
			this.removeTrackFromQueue(track.id)
		}
	}
	play() {}
	stop() {}
	skipForward() {}
	skipBackward() {}
	mute() {}
	setVolume(amount: number) {}
	maxVolume() {}
}