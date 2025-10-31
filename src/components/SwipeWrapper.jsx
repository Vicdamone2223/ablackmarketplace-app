// SwipeWrapper.jsx
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';

const SwipeWrapper = ({ children }) => {
  const navigate = useNavigate();

  const handlers = useSwipeable({
    onSwipedLeft: () => navigate(-1),
    delta: 30,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <div
      {...handlers}
      className="overflow-x-hidden"
      style={{
        // Use dynamic viewport to avoid Android 100vh bugs
        minHeight: '100dvh',
        // Keep content above fixed bottom nav (64px) + whichever inset is larger + small buffer
        paddingBottom:
          'calc(64px + max(var(--app-safe-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 12px)',
        // Keep content out from under status/notch
        paddingTop:
          'calc(max(var(--app-safe-top, 0px), env(safe-area-inset-top, 0px)) + 8px)',
      }}
    >
      {children}
    </div>
  );
};

export default SwipeWrapper;
