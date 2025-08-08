import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import User from "./User";
import Chat from "./Chat";

@Table({ tableName: "ChatUsers" })
class ChatUser extends Model<ChatUser> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => Chat)
  @Column
  chatId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  unreads: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Chat)
  chat: Chat;

  @BelongsTo(() => User)
  user: User;
}

export default ChatUser;
