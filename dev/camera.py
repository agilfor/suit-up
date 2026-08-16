import cv2

def main() -> int:
    cap : cv2.VideoCapture = cv2.VideoCapture(0)
    running : bool = True

    if not cap.isOpened():
        print("ERROR: Could not access the webcam")
        return 1

    try:
        while running:
            ret, frame = cap.read()
            if not ret:
                print("ERROR: Could not capture frame from camera")
                cap.release()
                return 1

            frame = cv2.flip(frame, 1)

            cv2.imshow("Camera", frame)
            if cv2.waitKey(1) & 0xFF in [27, ord('q')]: # 27 = ASCII for ESC
                running = False
    finally:
        cap.release()
        cv2.destroyAllWindows()

    return 0

exit(main())