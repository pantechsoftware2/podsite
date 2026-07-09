'use client';

type Props = { src: string };

export function AudioPlayer({ src }: Props) {
  return (
    <audio controls src={src} style={{ width: '100%' }}>
      Your browser does not support audio.
    </audio>
  );
}
