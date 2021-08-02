import Component from '@/Core/Component';
import './styles';
import {
  HistoryType,
  IHistory,
  IHistoryDayCardProps,
  MainModelType,
  Props,
  State,
  Today,
  TodayModelType,
} from '@/utils/types';
import { addComma, asyncSetState, html } from '@/utils/helper';
import HistoryList from '@/Components/HistoryList';
import MainModel from '@/Model/MainModel';
import DateModel from '@/Model/DateModel';

interface IListStates extends State {
  historyCards: IHistory[];
  today: Today;
  historyType: HistoryType;
  historyCardForToday: IHistory[];
}

export default class HistoryDayCard extends Component<
  IListStates,
  IHistoryDayCardProps
> {
  historyModel!: MainModelType;
  dateModel!: TodayModelType;

  setup() {
    this.classIDF = 'HistoryDayCard';
    this.historyModel = MainModel;
    this.historyModel.subscribe(this.historyModel.key, this);

    this.dateModel = DateModel;
    this.dateModel.subscribe(this.dateModel.key, this);

    this.$state = {
      historyCards: this.historyModel.historyCards,
      historyCardForToday: [],
      today: this.dateModel.today,
      historyType: this.historyModel.historyType,
    };

    asyncSetState(this.historyModel.getHistoryCard(this.$state!.today));
  }

  template() {
    const { onlyToday } = this.$props ?? { onlyToday: false };
    const { dates, histories } = this.updateList(onlyToday);

    return html`
      ${dates
        .map((date) => {
          const dayOfWeek = this.getDayOfWeek(date);
          const curHistories = histories[date];
          const expenseTotal = this.getExpenseTotal(curHistories);
          const incomeTotal = this.getIncomeTotal(curHistories);
          return `
        <li>
          <section class="history-day-card">
            <div class="history-date">
              <div class="date">${date} (${dayOfWeek})</div>
              <div class="total">
                ${incomeTotal ? '수입 ' + addComma(incomeTotal.toString()) : ''}
                ${
                  expenseTotal
                    ? '지출 ' + addComma(expenseTotal.toString())
                    : ''
                }
              </div>
            </div>
            <ul class="history-list">${HistoryList(curHistories)}</ul>
          </section>
        </li>
      `;
        })
        .join('')}
    `;
  }

  updateList(onlyToday?: boolean) {
    const { historyCards, historyCardForToday, historyType } = this.$state!;
    const { $totalNum, $incomeSum, $expenseSum } = this.$props!;

    const targetHistories = onlyToday ? historyCardForToday : historyCards;
    // 수입/지출 선택에 따른 historyList 추출
    const historyList = targetHistories.filter((history) => {
      if (historyType.expense && historyType.income) return true;
      else if (historyType.expense && !historyType.income)
        return history.type === 0;
      else if (!historyType.expense && historyType.income)
        return history.type === 1;
      else return false;
    });

    const incomeSum = historyList
      .filter((history) => history.type === 1)
      .reduce((acc, cur) => acc + cur.price, 0);
    const expenseSum = historyList
      .filter((history) => history.type === 0)
      .reduce((acc, cur) => acc + cur.price, 0);

    if (!onlyToday) {
      $totalNum!.innerText = historyList.length.toString();
      $incomeSum!.innerText = addComma(incomeSum!.toString());
      $expenseSum!.innerText = addComma(expenseSum!.toString());
    }

    // 해당 월의 history 추출
    const historyDates = historyList.map((history) => history.date);
    // 카드를 생성할 날짜를 중복 제거한 후 배열로 저장
    const dates = Array.from(new Set(historyDates)).sort().reverse();

    const histories = historyList.reduce(
      (acc: Record<string, IHistory[]>, history) => {
        if (!acc[history.date]) {
          acc[history.date] = [];
          acc[history.date].push(history);
          return acc;
        }

        acc[history.date].push(history);
        return acc;
      },
      {}
    );

    return { dates, histories };
  }

  getDayOfWeek(date: string) {
    return ['일', '월', '화', '수', '목', '금', '토'][new Date(date).getDay()];
  }

  getExpenseTotal(curDateHistories: IHistory[]) {
    return curDateHistories
      .filter((history) => history.type === 0)
      .reduce((acc, cur, i) => {
        return acc + cur.price;
      }, 0);
  }

  getIncomeTotal(curDateHistories: IHistory[]) {
    return curDateHistories
      .filter((history) => history.type === 1)
      .reduce((acc, cur, i) => {
        return acc + cur.price;
      }, 0);
  }

  removeEvent() {}

  setUnmount() {
    this.historyModel.unsubscribe(this.historyModel.key, this);
    this.dateModel.unsubscribe(this.dateModel.key, this);
  }
}
