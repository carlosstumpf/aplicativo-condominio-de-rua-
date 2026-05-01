CREATE TABLE `chamados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moradorId` int,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`categoria` enum('MANUTENCAO','SEGURANCA','LIMPEZA','OUTRO') NOT NULL DEFAULT 'OUTRO',
	`anexo` text,
	`status` enum('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO') NOT NULL DEFAULT 'ABERTO',
	`prioridade` enum('BAIXA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chamados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cobrancas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moradorId` int,
	`telefone` varchar(20) NOT NULL,
	`asaasPaymentId` varchar(100) NOT NULL,
	`tipo` enum('PIX','BOLETO') NOT NULL,
	`mesReferencia` varchar(7) NOT NULL,
	`valor` int NOT NULL,
	`vencimento` varchar(10) NOT NULL,
	`status` enum('PENDING','RECEIVED','OVERDUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`descricao` text,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cobrancas_id` PRIMARY KEY(`id`),
	CONSTRAINT `cobrancas_asaasPaymentId_unique` UNIQUE(`asaasPaymentId`)
);
--> statement-breakpoint
CREATE TABLE `despesas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoria` enum('MANUTENCAO','LIMPEZA','SEGURANCA','UTILIDADES','OUTROS') NOT NULL,
	`descricao` text NOT NULL,
	`valor` int NOT NULL,
	`comprovante` text,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `despesas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moradores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`telefone` varchar(20) NOT NULL,
	`nomeCompleto` text NOT NULL,
	`cpf` varchar(11) NOT NULL,
	`identificacaoCasa` varchar(50) NOT NULL,
	`statusAtivo` int NOT NULL DEFAULT 1,
	`asaasCustomerId` varchar(100),
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moradores_id` PRIMARY KEY(`id`),
	CONSTRAINT `moradores_telefone_unique` UNIQUE(`telefone`)
);
--> statement-breakpoint
CREATE TABLE `respostasChamados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chamadoId` int,
	`userId` int,
	`resposta` text NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `respostasChamados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_moradorId_moradores_id_fk` FOREIGN KEY (`moradorId`) REFERENCES `moradores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_moradorId_moradores_id_fk` FOREIGN KEY (`moradorId`) REFERENCES `moradores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moradores` ADD CONSTRAINT `moradores_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respostasChamados` ADD CONSTRAINT `respostasChamados_chamadoId_chamados_id_fk` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respostasChamados` ADD CONSTRAINT `respostasChamados_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;