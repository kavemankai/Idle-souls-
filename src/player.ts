import { mountExpedition } from './ui/expeditionScreen';
import { bindBrowserLifecycle } from './platform/browser';
import { bindNativeLifecycle } from './platform/native';
import './player.css';

bindBrowserLifecycle();
// Mount immediately; native initialization keeps the activity suspended until its state is known.
void bindNativeLifecycle().catch(error => {
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'Device controls could not start. Close and reopen Idle Souls.';
  (document.getElementById('xp') ?? document.getElementById('game'))!.prepend(message);
  console.error('Native lifecycle initialization failed', error);
});
mountExpedition(document.getElementById('game')!, { developer: false });
