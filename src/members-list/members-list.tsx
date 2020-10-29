import React from "react";
import { PubNubContext } from "../pubnub-provider";
import "./members-list.scss";

export interface MembersListProps {
  /* Select one of predefined themes */
  theme?: "light" | "dark";
  // /* Disable fetching of the users data */
  // disableUserFetch?: boolean;
  // /* Provide user data for message display */
  // users: MessageListUser[];
  /* Disable fetching of messages stored in the history */
  // disableHistoryFetch?: boolean;
  /* Provide custom member renderer if themes and CSS variables aren't enough */
  // messageRenderer?: (props: MessageRendererProps) => JSX.Element;
  /* A callback run on new messages */
  // onMessage?: (message: MessageListMessage) => unknown;
}

export interface MembersListMember {
  custom: {
    title: string;
    [key: string]: unknown;
  };
  eTag?: string;
  email?: string;
  externalId?: string;
  id: string;
  name: string;
  profileUrl: string;
  updated: string;
}

interface MembersListState {
  members: MembersListMember[];
}

export class MembersList extends React.Component<MembersListProps, MembersListState> {
  // private someRef: React.RefObject<HTMLDivElement>;

  static contextType = PubNubContext;
  // This is needed to have context correctly typed
  // https://github.com/facebook/create-react-app/issues/8918
  context!: React.ContextType<typeof PubNubContext>;

  static defaultProps = {
    theme: "light",
  };

  constructor(props: MembersListProps) {
    super(props);
    this.state = {
      members: [],
    };
  }

  /*
  /* Helper functions
  */

  private isOwnMember(uuid: string) {
    return this.context.pubnub?.getUUID() === uuid;
  }

  /*
  /* Commands
  */

  private async fetchMembers(pagination?: string) {
    try {
      const channel = this.context.channel;
      const response = await this.context.pubnub.objects.getChannelMembers({
        channel,
        sort: { "uuid.name": "asc" },
        page: { next: pagination },
        include: { totalCount: true, UUIDFields: true, customUUIDFields: true },
      });
      const fetchedMembers = response.data.map((u) => u.uuid);
      const currentMember = fetchedMembers.find((m) => this.isOwnMember(m.id));
      const currentMemberIndex = fetchedMembers.indexOf(currentMember);
      fetchedMembers.splice(currentMemberIndex, 1);

      this.setState({ members: [currentMember, ...this.state.members, ...fetchedMembers] });

      if (this.state.members.length < response.totalCount) {
        this.fetchMembers(response.next);
      }
    } catch (e) {
      console.error(e);
    }
  }

  /*
  /* Lifecycle
  */

  componentDidMount(): void {
    try {
      if (!this.context.pubnub)
        throw "Members List has no access to context. Please make sure to wrap the components around with PubNubProvider.";
      if (!this.context.channel.length)
        throw "PubNubProvider was initialized with an empty channel name.";

      this.fetchMembers();
    } catch (e) {
      console.error(e);
    }
  }

  /*
  /* Renderers
  */

  render(): JSX.Element {
    if (!this.context.pubnub || !this.context.channel.length) return null;
    const { members } = this.state;
    const { theme } = this.props;

    return (
      <div className={`pn-member-list pn-member-list--${theme}`}>
        {members.map((m) => this.renderMember(m))}
      </div>
    );
  }

  private renderMember(member) {
    const youString = this.isOwnMember(member.id) ? "(You)" : "";

    return (
      <div key={member.id} className="pn-member">
        {member.profileUrl && (
          <div className="pn-member__avatar">
            <img src={member.profileUrl} alt="User avatar " />
          </div>
        )}
        <div className="pn-member__main">
          <p className="pn-member__name">
            {member.name} {youString}
          </p>
          <p className="pn-member__title">{member?.custom?.title}</p>
        </div>
      </div>
    );
  }
}
