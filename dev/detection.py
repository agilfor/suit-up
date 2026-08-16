# Extends from camera.py
import cv2
import os
import time
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

FACE_MODEL_PATH : str = os.path.abspath("models/mediapipe/face_landmarker.task")

def main() -> int:
    global FACE_MODEL_PATH
    if not os.path.exists(FACE_MODEL_PATH):
        print("ERROR: path to face landmarker model does not exist (%s)" % FACE_MODEL_PATH)
        return 1

    cap : cv2.VideoCapture = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: Could not access the webcam")
        return 1

    try:
        running : bool = True

        BaseOptions = mp.tasks.BaseOptions
        FaceLandmarker = mp.tasks.vision.FaceLandmarker
        FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode
    
        options = FaceLandmarkerOptions(
            base_options = BaseOptions(
                model_asset_path=FACE_MODEL_PATH,
                delegate=BaseOptions.Delegate.CPU,
            ),
            running_mode = VisionRunningMode.VIDEO,
            num_faces = 1,
            output_face_blendshapes = True,
        )

        with FaceLandmarker.create_from_options(options) as landmarker:
            start_time = time.monotonic()
            while running:
                ret, frame = cap.read()
                if not ret:
                    print("ERROR: Could not capture frame from camera")
                    cap.release()
                    return 1

                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                h, w, _ = frame.shape

                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

                frame_timestamp_ms = int((time.monotonic() - start_time) * 1000)

                result = landmarker.detect_for_video(mp_image, frame_timestamp_ms)

                if result.face_landmarks and result.face_blendshapes:
                    # WIP: blendshapes for gesture recognition (e.g. blinking)
                    # blendshapes = result.face_blendshapes[0]
                    # r_blink_score, l_blink_score = blendshapes[9].score, blendshapes[10].score
                    for face in result.face_landmarks:
                        for l in face:
                            x, y = int(l.x * w), int(l.y * h)
                            cv2.circle(frame, (x, y), 2, (0, 0, 0), -1)
                else:
                    print("No result from mediapipe")

                cv2.imshow("Camera", frame)
                if cv2.waitKey(1) & 0xFF in [27, ord('q')]: # 27 = ASCII for ESC
                    running = False
    finally:
        cap.release()
        cv2.destroyAllWindows()

    return 0

exit(main())