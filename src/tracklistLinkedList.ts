import { AudioPlayerTrack } from './index'

class TrackNode {
	track: AudioPlayerTrack
	next: TrackNode | null = null;
	prev: TrackNode | null = null;

	constructor(track: AudioPlayerTrack) {
		this.track = track
	}
}

export class Tracklist {
	static TracklistLimitError = new Error('Track list limit has been reached.')
	private trackLimit: number
	private tracks: number = 0;
	private rear: TrackNode | null = null;
	private front: TrackNode | null = null;
	private current: TrackNode | null = null;

	constructor(args: { trackLimit: number }) {
		this.trackLimit = args.trackLimit
	}

	get empty(): boolean {
		return this.tracks === 0
	}

	get atLimit(): boolean {
		return this.tracks === this.trackLimit
	}

	get currentTrack(): AudioPlayerTrack | null {
		return this.current ? this.current.track : null
	}

	clear(): void {
		this.rear = null
		this.front = null
		this.current = null
		this.tracks = 0
	}

	isRear(trackId: TrackNode['track']['id']): boolean {
		if (!this.rear) {
			return false
		}
		return this.rear.track.id === trackId
	}

	isFront(trackId: TrackNode['track']['id']): boolean {
		if (!this.front) {
			return false
		}
		return this.front.track.id === trackId
	}

	addToFront(track: AudioPlayerTrack): void {
		if (this.atLimit) {
			throw Tracklist.TracklistLimitError
		}
		const node = new TrackNode(track)
		if (!this.front) {
			// front doesn't exist yet
			// set both front & rear to node
			this.rear = this.front = node;
			// set current node to this one since it's the only one
			this.current = node;
		} else {
			// front exists
			// set current front.next to node 
			this.front.next = node;
			// set node.prev to current front
			node.prev = this.front;
			// update front to node
			this.front = node;
		}
		this.tracks += 1
	}

	addToRear(track: AudioPlayerTrack): void {
		if (this.atLimit) {
			throw Tracklist.TracklistLimitError
		}
		const node = new TrackNode(track)
		if (!this.rear) {
			// rear doesn't exist yet
			// set both front & rear to node
			this.rear = this.front = node;
			// set current node to this one since it's the only one
			this.current = node;
		} else {
			// rear exists
			// set current rear.prev to node
			this.rear.prev = node;
			// set node.next to current rear
			node.next = this.rear;
			// update rear to node
			this.rear = node;
		}
		this.tracks += 1
	}

	moveCurrentForward(by: number = 1) {
		let moves = 0
		while (this.current && this.current.next && moves < by) {
			this.current = this.current.next
			moves++
		}
	}

	moveCurrentBack(by: number = 1) {
		let moves = 0
		while (this.current && this.current.prev && moves < by) {
			this.current = this.current.prev
			moves++
		}
	}

	removeRear(): void {
		if (!this.rear) return;

		// move current rear to next node
		this.rear = this.rear.next;
		if (this.rear) {
			// set current node prev to null
			// since we're at the back now
			this.rear.prev = null;
				this.tracks -= 1
		} else {
			// no more nodes exist
			this.front = null;
			this.tracks = 0
		}
}

	removeFront(): void {
			if (!this.front) return;

			// move front back one
			this.front = this.front.prev;
			if (this.front) {
				// set current node next to null
				// since we're at the front now
				this.front.next = null;
				this.tracks -= 1
			} else {
			// no more nodes exist
				this.rear = null;
				this.tracks = 0
			}
	}
}