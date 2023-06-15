import {ProgramService} from './modules/program/services/program/program.service';

export function appInitializerFactory(programService: ProgramService): () => Promise<void> {
	return () => programService.initWebsocket();
}
