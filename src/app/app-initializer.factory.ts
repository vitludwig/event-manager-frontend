import {InitService} from "./common/services/init/init.service";

export function appInitializerFactory(initService: InitService): () => Promise<void> {
	return () => initService.init();
}
