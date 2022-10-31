import { useEffect, useMemo, useState } from 'react';

import { Get, Response, transform_filters_to_request } from '../../../shared/Http';
import * as E from "fp-ts/lib/Either";
import Spinner from '../../../antd/Spinner/Spinner';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar  } from 'react-chartjs-2';
import { ChartInputParams } from '../chartInputFilter';

ChartJS.register(Filler);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  maintainAspectRatio: false,
  type: 'line',
  responsive: true,
  plugins: {
    filler: {
      propagate: false,
    },
    legend: {
      position: 'top' as const,
    },
    // title: {
    //   display: true,
    //   text: 'Chart.js Line Chart',
    // },
    padding: {
      top: 25,
      left: 15,
      right: 15,
      bottom: 200
    },
  },
  scales: {
    x: {
      // display: true,
      stacked: false,
      title: {
        display: true,
        text: 'Week'
      }
    },
    y: {
      // display: true,
      stacked: false,
      title: {
        display: true,
        text: 'Count'
      }
    }
  }
};



export function TimeSeriesChart({ axisX, axisY, filter, type}: ChartInputParams) {
  useEffect(() => {
    if (!filter.time_interval_from || !filter.time_interval_to) return
    if (Object.keys(filter).length) loadData();
  }, [filter]);

  const [fetching, setFetching] = useState(false);
  const exactCols:any = {
    facebook: '#2e89ff',
    youtube: '#f10000',
    twitter: '#51a3e3'
  }
  var cols = ["#bf501f", "#f59c34", "#89a7c6", "#7bc597", "#8d639a", "#8d639a", "#e4a774", "#828687", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick"]

  let labels = [''];

  let data_: any = {
    labels,
    datasets: [
      {
        label: '',
        data: labels.map(() => 0)
      },
    ],
  };

  const [data, setData] = useState(data_);
  const [timeInterval, setTimeInterval] = useState(1);


  const generate_dataset = (responce_data: any, labelType: string, filters: any, timeInterval: number) => {
    var dateFrom: Date = new Date(filters.time_interval_from)
    var dateTo: Date = new Date(filters.time_interval_to)
    console.log('generate_dataset timeInterval', timeInterval)
    dateTo.setDate(dateTo.getDate() + (timeInterval*2));
    dateFrom.setDate(dateFrom.getDate() + timeInterval);

    var interval: number = (dateTo.getTime() - dateFrom.getTime())
    var numberOfDays = Math.floor(interval / (24 * 60 * 60 * 1000));
    var numberOfWeeks = Math.ceil(numberOfDays / 7);
    
    if (type == 'bar') {
      options.scales.x.stacked = true
      options.scales.y.stacked = true
    }

    // var firstJan = new Date(1900 + dateFrom.getYear(), 0, 1)
    var firstJan = new Date(2022, 0, 1)
    var daysThisYear = (dateFrom.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000)
    var startTime = timeInterval == 7 ? Math.ceil(daysThisYear / 7) : Math.ceil(daysThisYear)
    var endTime = startTime + (timeInterval == 7 ? numberOfWeeks : numberOfDays)

    let intervals: any = ['']
    responce_data.forEach((i:any) => { 
      if(!i[labelType].title){ 
        i[labelType].title = i[labelType].label || i[labelType].term || i[labelType].title
    } })

    let post_label_values: [] = responce_data.map((i: any) => i[labelType].title).filter((v: any, i: any, a: any) => a.indexOf(v) === i)
    
    let datasets = type == 'line' 
      ? post_label_values.map((label: any, index: number) => ({
          label: label,
          data: [0],
          borderColor:  exactCols[label] || cols[index],
          lineTension: .35,
          radius: 4  
        }))
      : post_label_values.map((label: any, index: number) => ({
        label: label,
        data: [0],
        backgroundColor: exactCols[label] || cols[index],
        fill: true,
        pointBackgroundColor: 'rgba(0,0,0,.3)',
        borderColor: 'rgba(0,0,0,0)',
        lineTension: .35,
        radius: 4
      }))
    labels = []
    // console.log(startTime, endTime)

    for (let timeAt = startTime; timeAt <= endTime; timeAt++) {
      var intervalDate = new Date(firstJan);
      // console.log(intervalDate.toDateString())
      intervalDate.setDate(intervalDate.getDate() + (timeAt * timeInterval));
      // console.log(timeAt * timeInterval)
      // console.log(intervalDate.toDateString())

      labels.push(intervalDate.toISOString().slice(0, 10))

      datasets.forEach((dataset: any) => {
        let match = responce_data.filter((d: any) => d[labelType].title == dataset.label && d._id[timeInterval == 7 ? 'week' :'day'] == timeAt)
        // console.log(dataset.label, timeAt, match)
        if(!match.length){
          dataset.data.push(0)
        } else if (labelType == 'platform' || labelType == 'search_term_ids'  || labelType == 'account_id'){
          let count = match.reduce((a: any, b: any) => a += b.count, 0)
          dataset.data.push(count)
        } else {
          dataset.data.push(match.length)
        }
      })
    }
    
    return {
      labels,
      datasets: datasets,
    }
  }

  const loadData = () => {
    setFetching(true)
    var dateFrom: any = new Date(filter.time_interval_from)
    var dateTo: any = new Date(filter.time_interval_to)
    const diffTime: number = Math.abs(dateFrom - dateTo);
    const diffDays: number = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    let timeInterval_: number = diffDays < 26 ? 1 : 7
    // setTimeInterval(timeInterval_)

    // console.log('filter.time_interval_from', filter.time_interval_from)
    // console.log('filter.time_interval_to', filter.time_interval_to)
    // console.log('diffDays', diffDays)
    // console.log('setTimeInterval', timeInterval_)

    const fetchData = Get('posts_aggregated', {
      post_request_params: transform_filters_to_request(filter),
      axisX: axisX,
      axisY: axisY,
      days: timeInterval_
    });


    fetchData.then((_data: Response<any>) => {
      let maybeData: any = E.getOrElse(() => [data_])(_data)
      if (!maybeData.length) return

      let dataset_and_labels: any = generate_dataset(maybeData, axisX, filter, timeInterval_)
      setData(dataset_and_labels);
      setFetching(false)
    });
  }

 
  return (
    <div className="chart-cont-l">
      {
        fetching 
          ? <div className="button-tr"><div><div className="chart-loadding">Loading the chart...<Spinner /></div></div></div>
          : <div className="chart">
             { type == 'line' 
              ? <Line options={options} data={data} />
              : <Bar options={options} data={data} />
              }
          </div>
      }
    </div>
  );
}