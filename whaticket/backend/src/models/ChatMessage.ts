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

@Table({ tableName: "ChatMessages" })
class ChatMessage extends Model<ChatMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => Chat)
  @Column
  chatId: number;

  @ForeignKey(() => User)
  @Column
  senderId: number;

  @Column({ defaultValue: "" })
  message: string;

  @Column
  mediaPath: string;

  @Column
  mediaName: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Chat)
  chat: Chat;

  @BelongsTo(() => User)
  sender: User;
}

export default ChatMessage;
