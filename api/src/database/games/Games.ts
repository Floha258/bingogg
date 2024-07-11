import { Prisma } from '@prisma/client';
import { logError } from '../../Logger';
import { prisma } from '../Database';

export const allGames = () => {
    return prisma.game.findMany();
};

export const gameForSlug = (slug: string) => {
    // noinspection TypeScriptValidateJSTypes
    return prisma.game.findUnique({
        where: { slug },
        include: {
            owners: {
                select: { id: true, username: true },
            },
            moderators: {
                select: { id: true, username: true },
            },
        },
    });
};

export const createGame = async (
    name: string,
    slug: string,
    coverImage?: string,
    owners?: string[],
    moderators?: string[],
) => {
    try {
        return prisma.game.create({
            data: {
                name,
                slug,
                coverImage,
                owners: {
                    connect: owners?.map((o) => ({ id: o })),
                },
                moderators: {
                    connect: moderators?.map((m) => ({ id: m })),
                },
            },
        });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {statusCode: 400, message: "Game with this slug already exists"}
            }
            logError(`Database Known Client error - ${error.message}`);
            return {statusCode: 500, message: "Database error"}
        }
        logError(`Database Unknown error - ${error}`);
    }
};

export const deleteGame = (slug: string) => {
    return prisma.game.delete({ where: { slug } });
};

export const goalCount = async (slug: string) => {
    const game = await gameForSlug(slug)
    if (!game) {
        return -1;
    }
    return prisma.goal.count({
        where: {gameId: game.id}
    });
}

export const updateGameName = (slug: string, name: string) => {
    return prisma.game.update({ where: { slug }, data: { name } });
};

export const updateGameCover = (slug: string, coverImage: string) => {
    return prisma.game.update({ where: { slug }, data: { coverImage } });
};

export const updateSRLv5Enabled = (slug: string, enableSRLv5: boolean) => {
    return prisma.game.update({ where: { slug }, data: { enableSRLv5 } });
};

export const addOwners = (slug: string, users: string[]) => {
    return prisma.game.update({
        where: { slug },
        data: { owners: { connect: users.map((user) => ({ id: user })) } },
    });
};

export const addModerators = (slug: string, users: string[]) => {
    return prisma.game.update({
        where: { slug },
        data: { moderators: { connect: users.map((user) => ({ id: user })) } },
    });
};

export const removeOwner = (slug: string, user: string) => {
    return prisma.game.update({
        where: { slug },
        data: { owners: { disconnect: { id: user } } },
    });
};

export const removeModerator = (slug: string, user: string) => {
    return prisma.game.update({
        where: { slug },
        data: { moderators: { disconnect: { id: user } } },
    });
};

export const isOwner = async (slug: string, user: string) => {
    return (
        (await prisma.game.count({
            where: { slug, owners: { some: { id: user } } },
        })) > 0
    );
};

/**
 * Checks if the user is at least a moderator of the game
 * @param slug the game's slug for which to check user permissions
 * @param user the user's id to check permissions for'
 * @returns true if the user is a moderator or owner of the game, false otherwise
 */
export const isModerator = async (slug: string, user: string) => {
    return (
        (await prisma.game.count({
            where: {
                AND: [
                    { slug },
                    {
                        OR: [
                            { owners: { some: { id: user } } },
                            { moderators: { some: { id: user } } },
                        ],
                    },
                ],
            },
        })) > 0
    );
};
