# audio-player

An audio player built with Web Audio APIs to load and playback many audio files. This library does not provide a user interface, only a class and methods to perform the features of an audio player. 

## Features
This library supports:
1. loading audio files as AudioBuffers
1. playback via the `.play()`, `.pause()`, `.stop()`, `.skipForward()`, and `.skipBackward()` methods
1. Typescript

## Installation
```
npm i @keithalpichi/audio-player
```

## Usage

```typescript
import AudioPlayer from '@keithalpichi/audio-player'
// create an audio player instance
const audioPlayer = new AudioPlayer();
// initialize the player. You should call this after a user gesture but before any other methods.
audioPlayer.initialize()
// get an audio file from a server using fetch
const response = await fetch('https://localhost:443/song.wav');
// convert the response to an ArrayBuffer
const arrayBuffer = await response.arrayBuffer();
// load the buffer into the audio player.
await audioPlayer.load({ id: 'song.wav', arrayBuffer })
// play the sound
await audioPlayer.play()

// load more audio into the player and play them
await audioPlayer.skipForward()
await audioPlayer.play()
```

## Development
```
npm i
npm run build
```

## Roadmap

1. volume control via the `.mute()`, `.setVolume()`, and `.maxVolume()` methods
1. load audio from `audio` elements