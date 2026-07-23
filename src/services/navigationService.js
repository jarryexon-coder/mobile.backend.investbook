import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.log('Navigation not ready, trying later...');
    // Retry after a short delay
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      }
    }, 500);
  }
}

export function resetAndNavigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  } else {
    console.log('Navigation not ready, trying later...');
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name, params }],
          })
        );
      }
    }, 500);
  }
}

export function navigateToMain() {
  resetAndNavigate('Main');
}

export function navigateToLogin() {
  resetAndNavigate('Login');
}
