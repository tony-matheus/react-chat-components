import { useState, useEffect } from "react";
import { ChannelData, GetAllMetadataParameters } from "pubnub";
import { usePubNub } from "pubnub-react";
import merge from "lodash.merge";

type HookReturnValue = [ChannelData[], () => Promise<void>, number];

export const usePubNubChannels = (
  options: GetAllMetadataParameters = {},
  onError = (e) => console.error(e)
): HookReturnValue => {
  const pubnub = usePubNub();

  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [page, setPage] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const paginatedOptions = merge({}, options, {
    page: { next: page },
    include: { totalCount: true },
  });

  const command = async () => {
    try {
      if (totalCount && channels.length >= totalCount) return;
      const response = await pubnub.objects.getAllChannelMetadata(paginatedOptions);
      setChannels((channels) => [...channels, ...response.data]);
      setTotalCount(response.totalCount);
      setPage(response.next);
    } catch (e) {
      onError(e);
    }
  };

  useEffect(() => {
    command();
  }, []);

  return [channels, command, totalCount];
};