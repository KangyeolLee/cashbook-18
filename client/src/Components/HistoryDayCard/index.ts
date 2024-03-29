import Component from '@/Core/Component';
import './styles';
import dayjs from 'dayjs';
import {
  HistoryType,
  IHistory,
  IHistoryDayCardProps,
  HistoryModelType,
  State,
  Today,
  TodayModelType,
  CategoryModelType,
  CategoryType,
} from '@/utils/types';
import {
  addComma,
  asyncSetState,
  customEventEmitter,
  html,
} from '@/utils/helper';
import HistoryList from '@/Components/HistoryList';
import HistoryModel from '@/Model/HistoryModel';
import DateModel from '@/Model/DateModel';
import CategoryModel from '@/Model/CategoryModel';
import NoFound from './../NoFound/index';

interface IListStates extends State {
  historyCards: IHistory[];
  today: Today;
  historyType: HistoryType;
  historyCardForToday: IHistory[];
  categoryList: CategoryType[];
}

export default class HistoryDayCard extends Component<
  IListStates,
  IHistoryDayCardProps
> {
  historyModel!: HistoryModelType;
  dateModel!: TodayModelType;
  categoryModel!: CategoryModelType;

  setup() {
    this.classIDF = 'HistoryDayCard';
    this.historyModel = HistoryModel;
    this.historyModel.subscribe(this.historyModel.key, this);

    this.dateModel = DateModel;
    this.dateModel.subscribe(this.dateModel.key, this);

    this.categoryModel = CategoryModel;
    this.categoryModel.subscribe(this.categoryModel.key, this);

    this.$state = {
      historyCards: this.historyModel.historyCards,
      historyCardForToday: [],
      today: this.dateModel.today,
      historyType: this.historyModel.historyType,
      categoryList: this.categoryModel.categoryList,
    };

    asyncSetState(this.historyModel.getHistoryCard(this.$state.today));
    asyncSetState(this.categoryModel.getUserCategories());
  }

  template() {
    const { onlyToday } = this.$props ?? { onlyToday: false };
    const { dates, histories } = this.updateList(onlyToday);
    const { categoryList } = this.$state!;

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
                <span class="income">${
                  incomeTotal ? '수입 ' + addComma(incomeTotal.toString()) : ''
                }</span>
                <span class="outcome">${
                  expenseTotal
                    ? '지출 ' + addComma(expenseTotal.toString())
                    : ''
                }</span>
              </div>
            </div>
            <ul class="history-list">${HistoryList(
              curHistories,
              categoryList
            )}</ul>
          </section>
        </li>
      `;
        })
        .join('')}
      ${!dates.length && location.pathname === '/main' && NoFound()}
    `;
  }

  setEvent() {
    this.addEvent(
      'delete-history',
      this.$target.className,
      (e: CustomEvent) => this.handleDeleteHistory(e.detail),
      true
    );

    this.addEvent('click', '.list-control-box', (e: MouseEvent) => {
      const target = <HTMLElement>e.target;
      const historyId = Number(
        (<HTMLElement>target.closest('.history-list-item')).dataset.id
      );
      if (target.className.includes('update')) {
        this.handleEditHistory({ historyId });
      } else if (target.className.includes('delete')) {
        this.openAlertMessage(historyId);
      }
    });
  }

  openAlertMessage(historyId: number) {
    const $alert = document.querySelector('.alert') as HTMLElement;
    $alert.style.display = 'block';
    customEventEmitter('open-alert', { historyId }, $alert);
  }

  handleDeleteHistory({ historyId }: { historyId: number }) {
    asyncSetState(this.historyModel.deleteHistoryCard(historyId));
  }

  handleEditHistory({ historyId }: { historyId: number }) {
    const inputbarWrapper = document.querySelector(
      '.input-bar-wrapper'
    ) as HTMLElement;
    const targetHistory = this.historyModel.historyCards.filter(
      (history) => history.id === +historyId
    )[0];

    customEventEmitter('edit-history', targetHistory, inputbarWrapper);
  }

  updateList(onlyToday?: boolean) {
    const { historyCards, historyCardForToday, historyType, today } =
      this.$state!;
    const { $totalNum, $incomeSum, $expenseSum } = this.$props!;
    const { year, month } = today;

    const targetHistories = onlyToday ? historyCardForToday : historyCards;
    const date = dayjs(`${year}-${month}`).format('YYYY-MM');

    const historiesForTargetMonth = targetHistories.filter(
      (history) => dayjs(history.createdAt).format('YYYY-MM') === date
    );

    // 수입/지출 선택에 따른 historyList 추출
    const historyList = historiesForTargetMonth.filter((history) => {
      if (historyType.expense && historyType.income) return true;
      else if (historyType.expense && !historyType.income)
        return history.type === 0;
      else if (!historyType.expense && historyType.income)
        return history.type === 1;
      else return false;
    });

    const incomeSum = historyList
      .filter((history) => history.type === 1)
      .reduce((acc, cur) => acc + Number(cur.price), 0);
    const expenseSum = historyList
      .filter((history) => history.type === 0)
      .reduce((acc, cur) => acc + Number(cur.price), 0);

    if (!onlyToday && $totalNum && $incomeSum && $expenseSum) {
      $totalNum!.innerText = historyList.length.toString();
      $incomeSum!.innerText = addComma(incomeSum!.toString());
      $expenseSum!.innerText = addComma(expenseSum!.toString());
    }

    // 해당 월의 history 추출
    const historyDates = historyList.map((history) =>
      dayjs(history.createdAt).format('YYYY-MM-DD')
    );
    // 카드를 생성할 날짜를 중복 제거한 후 배열로 저장
    const dates = Array.from(new Set(historyDates)).sort().reverse();

    const histories = historyList.reduce(
      (acc: Record<string, IHistory[]>, history) => {
        const date = dayjs(history.createdAt).format('YYYY-MM-DD');
        if (!acc[date]) {
          acc[date] = [];
          acc[date].push(history);
          return acc;
        }

        acc[date].push(history);
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
      .reduce((acc, cur) => {
        return acc + Number(cur.price);
      }, 0);
  }

  getIncomeTotal(curDateHistories: IHistory[]) {
    return curDateHistories
      .filter((history) => history.type === 1)
      .reduce((acc, cur) => {
        return acc + Number(cur.price);
      }, 0);
  }

  removeEvent() {}

  setUnmount() {
    this.historyModel.unsubscribe(this.historyModel.key, this);
    this.dateModel.unsubscribe(this.dateModel.key, this);
    this.categoryModel.unsubscribe(this.categoryModel.key, this);
  }
}
