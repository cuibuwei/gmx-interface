import { t, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import { getExplorerUrl } from "config/chains";
import { getTokens } from "config/tokens";
import { selectGmMarkets } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { INCENTIVE_TOOLTIP_MAP, INCENTIVE_TYPE_MAP } from "domain/synthetics/common/incentivesAirdropMessages";
import useUserIncentiveData, { UserIncentiveData } from "domain/synthetics/common/useUserIncentiveData";
import { MarketsData, useMarketTokensData } from "domain/synthetics/markets";
import { TokensData } from "domain/synthetics/tokens";
import { Token } from "domain/tokens";
import { bigMath } from "lib/bigmath";
import { useChainId } from "lib/chains";
import { formatDate } from "lib/dates";
import { GM_DECIMALS } from "lib/legacy";
import { expandDecimals, formatTokenAmount, formatUsd } from "lib/numbers";
import { shortenAddressOrEns } from "lib/wallets";
import useWallet from "lib/wallets/useWallet";

import Button from "components/Button/Button";
import Card from "components/Common/Card";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { BottomTablePagination } from "components/Pagination/BottomTablePagination";
import EmptyMessage from "components/Referrals/EmptyMessage";
import usePagination from "components/Referrals/usePagination";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import Tooltip from "components/Tooltip/Tooltip";
import { ExchangeTd, ExchangeTh, ExchangeTheadTr, ExchangeTr } from "../OrderList/ExchangeTable";

type NormalizedIncentiveData = ReturnType<typeof getNormalizedIncentive>;

function getNormalizedIncentive(
  incentive: UserIncentiveData,
  tokens: Token[],
  gmMarkets: MarketsData | undefined,
  marketTokensData: TokensData | undefined
) {
  const tokenIncentiveDetails = incentive.tokens.map((tokenAddressRaw, index) => {
    // backend should send tokenAddress in lowercase but we double-check here to not break the logic
    const tokenAddress = tokenAddressRaw.toLowerCase();
    const marketTokenKey = gmMarkets ? Object.keys(gmMarkets).find((key) => key.toLowerCase() === tokenAddress) : null;
    const marketToken = marketTokenKey ? gmMarkets?.[marketTokenKey] : undefined;
    const tokenInfo = marketToken ? undefined : tokens.find((token) => token.address.toLowerCase() === tokenAddress);
    const amountInUsd =
      marketTokensData && marketToken
        ? bigMath.mulDiv(
            BigInt(incentive.amounts[index]),
            marketTokensData[marketToken.marketTokenAddress].prices.maxPrice,
            expandDecimals(1, GM_DECIMALS)
          )
        : BigInt(incentive.amountsInUsd[index]);

    return {
      symbol: tokenInfo ? tokenInfo.symbol : marketToken?.name,
      decimals: tokenInfo ? tokenInfo.decimals : GM_DECIMALS,
      amount: BigInt(incentive.amounts[index]),
      amountInUsd,
      id: `${incentive.id}-${tokenAddress}`,
    };
  });

  const totalUsd = tokenIncentiveDetails.reduce((total, tokenInfo) => total + tokenInfo.amountInUsd, 0n);

  return {
    ...incentive,
    tokenIncentiveDetails,
    totalUsd,
    typeId: Number(incentive.typeId),
  };
}

export default function UserIncentiveDistributionList() {
  const { account, active } = useWallet();
  const { openConnectModal } = useConnectModal();
  const { chainId } = useChainId();
  const tokens = getTokens(chainId);
  const gmMarkets = useSelector(selectGmMarkets);
  const { marketTokensData } = useMarketTokensData(chainId, { isDeposit: false });
  const userIncentiveData = useUserIncentiveData(chainId, account);

  const normalizedIncentiveData: NormalizedIncentiveData[] = useMemo(
    () =>
      userIncentiveData?.data?.map((incentive) =>
        getNormalizedIncentive(incentive, tokens, gmMarkets, marketTokensData)
      ) ?? [],
    [userIncentiveData?.data, tokens, gmMarkets, marketTokensData]
  );

  const { currentPage, getCurrentData, setCurrentPage, pageCount } = usePagination(
    "UserIncentiveDistributionList",
    normalizedIncentiveData
  );
  const currentIncentiveData = getCurrentData();

  if (!userIncentiveData?.data?.length) {
    return (
      <EmptyMessage
        tooltipText={t`Incentives are airdropped weekly.`}
        message={t`No incentives distribution history yet.`}
        className="!mt-10"
      >
        {!active && (
          <div className="mt-15">
            <Button variant="secondary" onClick={openConnectModal}>
              <Trans>Connect Wallet</Trans>
            </Button>
          </div>
        )}
      </EmptyMessage>
    );
  }

  return (
    <div>
      <Card
        title={t`Incentives Distribution History`}
        tooltipText={t`Incentives are airdropped weekly.`}
        bodyPadding={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <ExchangeTheadTr>
                <ExchangeTh>
                  <Trans>Date</Trans>
                </ExchangeTh>
                <ExchangeTh>
                  <Trans>Type</Trans>
                </ExchangeTh>
                <ExchangeTh>
                  <Trans>Amount</Trans>
                </ExchangeTh>
                <ExchangeTh>
                  <Trans>Transaction</Trans>
                </ExchangeTh>
              </ExchangeTheadTr>
            </thead>
            <tbody>
              {currentIncentiveData?.map((incentive) => <IncentiveItem incentive={incentive} key={incentive.id} />)}
            </tbody>
          </table>
        </div>
        <BottomTablePagination page={currentPage} pageCount={pageCount} onPageChange={setCurrentPage} />
      </Card>
    </div>
  );
}

function IncentiveItem({ incentive }: { incentive: NormalizedIncentiveData }) {
  const { tokenIncentiveDetails, totalUsd, timestamp, typeId, transactionHash } = incentive;
  const { chainId } = useChainId();
  const explorerURL = getExplorerUrl(chainId);
  const { _ } = useLingui();

  const isCompetition = typeId >= 2000 && typeId < 3000;
  const typeStr = isCompetition ? t`COMPETITION Airdrop` : _(INCENTIVE_TYPE_MAP[typeId] ?? t`Airdrop`);
  const tooltipData = INCENTIVE_TOOLTIP_MAP[typeId];

  const renderTotalTooltipContent = useCallback(() => {
    return tokenIncentiveDetails.map((tokenInfo) => (
      <StatsTooltipRow
        key={tokenInfo.id}
        showDollar={false}
        label={tokenInfo.symbol}
        value={formatTokenAmount(tokenInfo.amount, tokenInfo.decimals, "", {
          useCommas: true,
        })}
      />
    ));
  }, [tokenIncentiveDetails]);
  const renderTooltipTypeContent = useCallback(
    () =>
      tooltipData ? (
        <Link className="link-underline" to={tooltipData.link}>
          {_(tooltipData.text.id)}
        </Link>
      ) : null,
    [_, tooltipData]
  );
  const type = tooltipData ? <Tooltip handle={typeStr} renderContent={renderTooltipTypeContent} /> : typeStr;

  return (
    <ExchangeTr bordered={false} hoverable={false}>
      <ExchangeTd data-label="Date">{formatDate(timestamp)}</ExchangeTd>
      <ExchangeTd data-label="Type">{type}</ExchangeTd>
      <ExchangeTd data-label="Amount">
        <Tooltip handle={formatUsd(totalUsd)} className="whitespace-nowrap" renderContent={renderTotalTooltipContent} />
      </ExchangeTd>
      <ExchangeTd data-label="Transaction">
        <ExternalLink href={`${explorerURL}tx/${transactionHash}`}>
          {shortenAddressOrEns(transactionHash, 13)}
        </ExternalLink>
      </ExchangeTd>
    </ExchangeTr>
  );
}
