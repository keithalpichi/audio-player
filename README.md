# audio-player

A browser audio player built with Typescript and Web Audio APIs to load and playback many audio files. This library does not provide a user interface, only a class and methods to perform the features of an audio player.

## Features

This library supports:

1. loading many audio files as AudioBuffers. Audio is loaded into the player via the `.load()` and `loadToRear()` methods. The track list acts as a doubly linked-list. The play head can move forward and back through this track list.
1. playback via the `.play()`, `.pause()`, `.stop()`, `.skipForward()`, and `.skipBackward()` methods. The latter two methods will only skip as far as there is loaded audio.
1. volume control via the `.mute()`, `.unmute()`, `.setVolume()`, and `.maxVolume()` methods. If the volume is changed while it is muted, the audio player will not unmute. When it is unmuted, volume will be set to the last known value. That is the value prior to muting or any volumes provided to `.setVolume()` or `.maxVolume()`.
1. Typescript

## Installation

```
npm i @keithalpichi/audio-player
```

## Usage

```typescript
import AudioPlayer from "@keithalpichi/audio-player";
// create an audio player instance
const audioPlayer = new AudioPlayer();
// get an audio file from a server using fetch
const response = await fetch("https://localhost:443/song.wav");
// convert the response to an ArrayBuffer
const arrayBuffer = await response.arrayBuffer();
// load the buffer into the audio player and await the promise to resolve
await audioPlayer.load({ id: "song.wav", arrayBuffer });
// play the sound
audioPlayer.play();
// audio player keeps track of the current audio file.
// invoking .play() plays the sound again.
audioPlayer.play();

// load more audio into the player and play them
audioPlayer.skipForward();
audioPlayer.play();

// go back to the previous audio file
audioPlayer.skipBackward();
audioPlayer.play();

// mute audio
audioPlayer.mute();

// unmute audio back to the last known volume
audioPlayer.unmute();
```

## Development

```
npm i
npm run build
```

## Contributing

If you're interested in proposing changes or have issues please browse the [issues](https://github.com/keithalpichi/audio-player/issues) page to see if it exists already. If not consider opening a new issue.

## Roadmap
