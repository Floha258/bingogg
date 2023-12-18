import { OPEN, WebSocketServer } from 'ws';
import { verifyRoomToken } from '../auth/RoomAuth';
import { RoomAction } from '../types/RoomAction';
import { Board, ServerMessage } from '../types/ServerMessage';

/**
 * Represents a room in the bingo.gg service. A room is container for a single
 * "game" of bingo, containing, the board, game state, history, and all other
 * game level data.
 */
export default class Room {
    name: string;
    game: string;
    password: string;
    slug: string;
    websocketServer: WebSocketServer;
    board: Board = {
        board: [
            [
                { goal: 'Collect 5 things', colors: [] },
                { goal: 'Talk to 10 people', colors: [] },
                { goal: 'A pointy device', colors: [] },
                { goal: 'Obtain a hammer', colors: [] },
                { goal: 'YELL', colors: [] },
            ],
            [
                { goal: '10 Wells', colors: [] },
                { goal: '15 flames', colors: [] },
                { goal: 'Beat the game', colors: [] },
                { goal: 'Die 10 times', colors: [] },
                { goal: 'Beat 5-2', colors: [] },
            ],
            [
                { goal: 'Beat 3-5', colors: [] },
                { goal: 'Discover Persia', colors: [] },
                { goal: 'Invent Religion', colors: [] },
                { goal: 'C O N Q U E S T', colors: [] },
                {
                    // eslint-disable-next-line max-len
                    goal: 'this is a really long goal name because sometimes these will exist and it needs to be tested against',
                    colors: [],
                },
            ],
            [
                { goal: 'Return to Madagascar', colors: [] },
                { goal: 'Morph Ball', colors: [] },
                { goal: '500 HP', colors: [] },
                { goal: '50 coins', colors: [] },
                { goal: 'Have a civil war', colors: [] },
            ],
            [
                { goal: 'Game over', colors: [] },
                { goal: 'Kill 300 enemies', colors: [] },
                { goal: 'Explosives', colors: [] },
                { goal: 'Compass', colors: [] },
                { goal: 'Roads', colors: [] },
            ],
        ],
    };

    constructor(name: string, game: string, slug: string) {
        this.name = name;
        this.game = game;
        this.password = 'password';
        this.slug = slug;

        // initialize the websocket server
        this.websocketServer = new WebSocketServer({ noServer: true });
        this.websocketServer.on('connection', (ws) => {
            this.sendChat('join');
            ws.on('message', (message) => {
                const action: RoomAction = JSON.parse(message.toString());
                try {
                    const identity = verifyRoomToken(action.authToken);
                    switch (action.action) {
                        case 'join':
                            ws.send(
                                JSON.stringify({
                                    action: 'syncBoard',
                                    board: this.board,
                                }),
                            );
                            this.sendChat(`${identity.nickname} has joined.`);
                            break;
                        case 'leave':
                            this.sendChat(`${identity.nickname} has left.`);
                            ws.close();
                            break;
                        case 'mark':
                            const { row, col } = action.payload;
                            if (row === undefined || col === undefined) return;
                            if (
                                this.board.board[row][col].colors.includes(
                                    identity.color,
                                )
                            )
                                return;
                            this.board.board[row][col].colors.push(
                                identity.color,
                            );
                            this.sendCellUpdate(row, col);
                            this.sendChat(
                                `${identity.nickname} is marking (${row},${col})`,
                            );
                            break;
                        case 'unmark':
                            const { row: unRow, col: unCol } = action.payload;
                            if (unRow === undefined || unCol === undefined)
                                return;
                            this.board.board[unRow][unCol].colors =
                                this.board.board[unRow][unCol].colors.filter(
                                    (color) => color !== identity.color,
                                );
                            this.sendCellUpdate(unRow, unCol);
                            this.sendChat(
                                `${identity.nickname} is unmarking (${unRow},${unCol})`,
                            );
                            break;
                        case 'chat':
                            const { message: chatMessage } = action.payload;
                            if (!message) return;
                            this.sendChat(chatMessage);
                    }
                } catch {
                    return;
                }
            });
            ws.on('close', () => {
                this.sendChat('leave');
            });
        });
        this.websocketServer.on('close', () => {
            this.sendChat('leave');
        });
    }

    sendChat(message: string) {
        this.sendServerMessage({ action: 'chat', message });
    }

    sendCellUpdate(row: number, col: number) {
        this.sendServerMessage({
            action: 'cellUpdate',
            row,
            col,
            cell: this.board.board[row][col],
        });
    }

    private sendServerMessage(message: ServerMessage) {
        this.websocketServer.clients.forEach((client) => {
            if (client.readyState === OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}
