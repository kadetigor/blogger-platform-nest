export class CommentatorInfo {
    userId: string;
    userLogin: string;
}

export class CreateCommentDto {
    content: string;
    commentatorInfo: CommentatorInfo;
    postId: string;
}