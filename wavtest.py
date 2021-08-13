import wave
import contextlib

import sys
fname = sys.argv[1] 

with contextlib.closing(wave.open(fname,'r')) as f:
    frames = f.getnframes()
    print(frames)
    framesize = f
    rate = f.getframerate()
    print(rate)
    duration = frames / float(rate)
    print(duration * 1000)
    