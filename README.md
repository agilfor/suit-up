# suit-up

So recently I've been seeing a lot of videos online about people making their own Iron Man suits and software, which looks awesome but is way beyond what I can do. So instead I thought it would be cool to make something that overlays an Iron Man suit onto a person with some image processing and smartly positioned rendering.

## Image processing

Currently uses fully local browser-based MediaPipe face landmark detection model to detect landmarks on the face to calculate where the mask needs to be placed and what orientation it should be in. The only issue now is a slight offset (the back of the mask is on the nose so it looks weird when you turn your head).

## Rendering

Currently browser-based Three.js rendering with models found on [Printables](https://www.printables.com/model/985355-iron-man-wearable-helmet-3d-print-model/files). Right now it loads the entire helmet as one mesh, but in future the faceplate and helmet should be rendered separately to allow for the faceplate opening scene like in the movies :)

## Current progress

Working:

- Face landmark position detection and orientation calculation
- Full helmet rendering on face
- Fully local in-browser face tracking and rendering

---

To do:

- Add colors to the helmet
- Split helmet into a helmet and faceplate mesh
- Fix weird positioning issue on the face
- Full body landmark detection (when in frame)
- Full suit rendering on body
- Add lighting effects (glowing eyes, etc.)

## Final notes

This project was started for Hack Club Stardance, but is currently sort of on hold. If you like what you see feel free to take what I've built and take it a step further. Regardless, I hope you enjoy this [demo](https://agilfor.github.io/suit-up) :)
