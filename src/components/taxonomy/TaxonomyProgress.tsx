import { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row, Layout, Space } from 'antd';
import * as E from "fp-ts/lib/Either";
import { Link } from "react-router-dom";

import './Taxonomy.css';
import { Get } from '../../shared/Http';
import { MonitorProgressResponse, MonitorRespose, Progress } from '../../types/taxonomy';
import { useLocation } from 'react-router-dom';
import ProgressBar from '../../antd/PogressBar/ProgressBar';
import { pipe } from 'ramda';
import { then } from '../../shared/Utils';
import { left, fold } from 'fp-ts/lib/Either';
import { match } from 'ts-pattern';
import { platformIcon } from '../../shared/Utils';

const TaxonomyProgress: React.FC = () => {

  const { Content } = Layout;
  const [monitorData, setMonitorData] = useState<MonitorRespose>();
  const [monitorProgress, setMonitorProgress] = useState<MonitorProgressResponse>();
  const { search } = useLocation();
  const [timeout, setTimeout_] = useState<NodeJS.Timeout>();
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<[]>();
  const [isFinalizedState, setisFinalizedState] = useState<boolean>(false);

  const monitor_id = useMemo(() => new URLSearchParams(search).get('monitor_id') || "", [search]);          

  // 1. get_monitor, returns the monitor details like name, date range and used keywords
  // 2. monitor_progress, returns the information about the progress of data collection
  // 'get_monitor', 
  const noErrors = (monitorData: any) => {
    // console.log(monitorData)

    return !Boolean(monitorData?.detail?.out_of_limit.length);
  } 
  const secondsToHms = (d:number) => {
      d = Number(d);
      var h: number = Math.floor(d / 3600);
      var m: number = Math.floor(d % 3600 / 60);
      var s: number = Math.floor(d % 3600 % 60);

      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return hDisplay + mDisplay + sDisplay; 
  }
  useEffect(() => {
    Get<MonitorRespose>('run_data_collection', { id: monitor_id })
      .then(E.fold(console.error, 
        (monitorData: any) => match(noErrors(monitorData))
        .with(true, () => {
          // console.log('no errors')
          setMonitorData(monitorData)
        }).otherwise(() => {
          setErrors(monitorData?.detail?.out_of_limit)
          // console.log(monitorData?.detail?.out_of_limit)
          // console.log(333, errors)
        })));
  }, [monitor_id]);

  
  const clearTimeout_ = useCallback(() => {
    timeout && clearTimeout(timeout);
    setTimeout_(undefined);
  }, [timeout]);

  const isFinalized = (res: MonitorProgressResponse) => {
    return res.reduce((isFinalized_: boolean, progress:Progress) => !isFinalized_ 
      ? isFinalized_ 
      : (progress.tasks_count === progress.finalized_collect_tasks_count && progress.tasks_count !== 0) , true)
  }

  useEffect(() => {
    if (loading) return;
    console.log('check1', loading)
    if (!monitorData) return;
    // console.log(555, monitorData)
    setLoading(true);
    console.log('setTrue1', loading)
    clearTimeout_();
    const try_ = () => {
        console.log('check2', loading)
        if (loading) return;
        setLoading(true);
        console.log('setTrue2', loading)

        pipe(
          then((fold(
            (err: Error) => console.log('errr', left(err)),
            (res: MonitorProgressResponse) => match(isFinalized(res))
              .with(false, () => {
                console.log("Is Finalized ", isFinalized(res));
                setLoading(false);
                console.log('setfalse1', loading)

                setMonitorProgress(res);
                const timeout_: any = setTimeout(() => setTimeout_(timeout_), 15000);
                return;
              })
              .otherwise(() => {
                setLoading(false);
                console.log('setfalse2', loading)

                clearTimeout_();
                setMonitorProgress(res);
                console.log("Is Finalized ", isFinalized(res));
                setisFinalizedState(true);
              })
          )))
        )(Get<MonitorProgressResponse>('monitor_progress', { id: monitor_id }));
    }
    try_();
    return () => clearTimeout_();
  }, [monitorData, timeout, monitor_id, clearTimeout_]);


  return (
    <>
      <div className='data-collection-content'>
        {
          
            
          <Content>
            
            <Space size={'middle'} className="taxonomy-header-spacer">
              {/* <h1>Data Collection Step - 4</h1> */}
              
              <h2>Monitor name: { monitorData?.monitor?.title }</h2>
            
              <h2>Monitor description: { monitorData?.monitor?.descr }</h2>
            </Space>

            <Row>
              <Col>
                <br />
                Estimated
              </Col>
            </Row>

            <Row>
              <Col>
                Date - { monitorData?.monitor?.date_from && monitorData?.monitor?.date_from.toString().slice(0, 10) }
              </Col>
            </Row>

            <Row>
              <Col>
                <h1>Platforms</h1> { monitorData?.monitor?.platforms?.map(a => <span>a</span>) }
              </Col>
            </Row>
            {
              errors && errors?.length > 0 
              ? 
                <Space size={'middle'} className="taxonomy-header-spacer">
                  <span>The number of posts for some search terms / accounts exceed allowed maximum limit of 10 000 posts.
  
                  Please <Link className='underline-link' to={`/taxonomy/results?monitor_id=${monitor_id}`}>modify</Link> the monitor and try again</span>
                { 
                  errors.map((error: any) => <>
                      <span className="">{platformIcon(error.platform)} {error?.search_terms && error?.search_terms.length ? error?.search_terms[0].term : error?.accounts[0].title} {error.hits_count}</span>
                  </>)
                }
                </Space>
                : monitorProgress && monitorProgress.length > 0 ? monitorProgress.map((item, i) => {
                let progressValue: number = 0;
                if (item.platform) {
                  progressValue = item.finalized_collect_tasks_count * 100 / item.tasks_count;
                  progressValue = Math.floor(progressValue * 100)/100
                }
                
                // console.log(`NUmber -> for index ${i}`, progressValue);
                return (
                  <Row key={item.platform}>
                    <Col span={4}>
                      { item.platform } stats 
                    </Col>

                    <Col span={20}>
                      { typeof(progressValue) === "number" && progressValue < 100 ? "Details are being loaded…" : "Details fetched" } 
                      
                      <ProgressBar percentage={progressValue} showInfo={true} />

                      {
                        `Posts count: ${item.posts_count}`
                      }
                      
                      {' - '}
                      {
                        item?.time_estimate ? `Estimated time to get data: ${secondsToHms(item.time_estimate)}` : ''
                      }
                    </Col>
                  </Row>
                )
              }) : <h1>No Data Available</h1>
              
            }
            {
                isFinalizedState ? <div><Link to={`/results/summary?monitor_id=${monitor_id}`}>Go to monitor results</Link> </div> : <></>
            }
              </Content>
        }
      </div>
    </>
  );
}

export default TaxonomyProgress;