import {WebWorkerMLCEngineHandler} from './vendor/webllm-0.2.86.js';
const handler=new WebWorkerMLCEngineHandler();
self.onmessage=event=>handler.onmessage(event);
