# SillyTavern-Piper-TTS

Works only on windows for now and only English is available.
1) Go to config.yaml
2) Enable plugins `enableServerPlugins: true`
3) Unzip SillyTavern-Piper-TTS in folder plugin
4) run `npm install`
4) run start.bat file from root folder of SillyTavern

Just go to tts select silero with default settings, choose voices.

# Github doesn't give enough free LFS, download the model from here and not github
Check the model folder there should be this model: https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx?download=true
It should be around 70mb
You don't need Extra or Silero server.

TO DO:
Add more languages, support for Mac and Linux (maybe very easy to do ?).
Clean code.

# I have another project using piper tts
It creates all voices samples from a multi speaker model, it opens a web browser and then you can listen to them one by one, probablly I'll soon post it on github so you can choose the voices you want, for any model

If anyone has custom models that works with piper TTS, contact me thanks.
The only thing I regret is that piper TTS doesn't have many models.

Feel free to tweak this, or contribute.
