import { Button, Card, Col, List, Modal, Row, Space } from 'antd';
import React, { useCallback, useEffect, useState } from 'react'
import classes from './MonitorList.module.css'
import { PieChartOutlined, CopyOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import Meta from 'antd/lib/card/Meta';
import { Delete, Get, Response } from '../../shared/Http';
import * as E from "fp-ts/lib/Either";
import { Monitor, MonitorRespose } from '../../types/taxonomy';
import { Link, useNavigate } from 'react-router-dom';
import { MonitorBlock } from '../../components/monitor/Monitor';

const MonitorList: React.FC = () => {
  const [data, setData] = useState<MonitorRespose[]>([]);
  const [fetching, setFetching]: any = useState(true);
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);

  const [monitorId, setMonitorId] = useState("");

  const navigate = useNavigate();
  
  const showDeleteModal = (monitorItem: Monitor) => {
    console.log(monitorItem)
    setMonitorId(monitorItem?._id);
    setDeleteModalVisible(true);
  };
  
  const hideDeleteModal = () => {
    setMonitorId("");
    setDeleteModalVisible(false);
  };

  const deleteItemHandler = useCallback(() => {
    const fetchData = Delete('delete_monitor', { monitor_id: monitorId });

    fetchData.then((_data: Response<any>) => {
      let maybeData = E.getOrElse(() => [])(_data)
      if (!maybeData || !maybeData.forEach) return
      console.log(maybeData);
    });
  }, [monitorId]);
  
  const showDuplicateModal = (monitorItem: Monitor) => {
    console.log(monitorItem)
    setMonitorId(monitorItem?._id);
    setDuplicateModalVisible(true);
  };
  
  const hideDuplicateModal = () => {
    setMonitorId("");
    setDuplicateModalVisible(false);
  };
  
  const duplicateItemHandler = useCallback(
    () => {
      const fetchData = Get('duplicate_monitor', { monitor_id: monitorId });

      fetchData.then((_data: Response<any>) => {
        let maybeData = E.getOrElse(() => [])(_data)
        if (!maybeData || !maybeData.forEach) return
        console.log(maybeData);
      });
    }, [monitorId]
  );
  useEffect(() => {
    if(data?.length){
      console.log(2222222222222, data)
      setFetching(false)
    }
  },[data])

  useEffect(() => {
    setFetching(true)
    Get<MonitorRespose[]>('get_monitors', { tag: '*' })
        .then(E.fold(console.error, setData));
  }, [duplicateItemHandler, deleteItemHandler])
  const extraButtons = {
    showDuplicateModal: showDuplicateModal, 
    showDeleteModal: showDeleteModal
  }
  // <Button  onClick={() => showDuplicateModal(monitorItem)}><CopyOutlined key="duplicate" /> Duplicate</Button>,
  // <Button  onClick={() => showDeleteModal(monitorItem)}><DeleteOutlined key="delete" /> Delete</Button>]
  return (
    <div>
      <div className="tax-title-line">
        <div className="tax-mid">Monitors <Link to='/taxonomy/init'>              <Button>Create</Button>            </Link></div>
        {/* <div className="tax-mid">Monitors  </div> */}

      </div>
      <Row justify="center" className="tax-scroll monitor-list">
        <Space className="tax-mid mt-20" direction="vertical" size="middle">
        
      {
        deleteModalVisible && (
          <>
              <Modal
                title="Modal"
                visible={deleteModalVisible}
                onOk={deleteItemHandler}
                onCancel={hideDeleteModal}
                okText="Ok"
                cancelText="Cancel"
              >
                <p>Confirm delete action for monitor {monitorId}?</p>
            </Modal>
          </>
        )
      }

      {
        duplicateModalVisible && (
          <>
              <Modal
                title="Modal"
                visible={duplicateModalVisible}
                onOk={hideDuplicateModal}
                onCancel={hideDuplicateModal}
                okText="Ok"
                cancelText="Cancel"
              >
                <p>Confirm duplicate action for monitor {monitorId}?</p>
            </Modal>
          </>
        )
      }
      
      <List
      grid={{ gutter: 16, column: 4 }}
      >
        {
          !fetching ? (
            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            {data.map((monitorItem: MonitorRespose) => {
              let monitorDescription = "";
              if (monitorItem.date_to) {
                monitorDescription = monitorItem.descr + ' ' 
                + monitorItem.date_from.toString().slice(0, 10) + monitorItem?.date_to.toString().slice(0, 10)
              }
              else {
                monitorDescription = monitorItem.descr + ' ' 
                + monitorItem.date_from.toString().slice(0, 10) + ""
              }

              return (
                  <Col className="gutter-row" span={24}>
                    
                    {/* <Card
                      // style={{ width: 300, marginTop: 16 }}
                      className="post monitor"
                      title={monitorItem.title}
                      actions={[
                        <Button onClick={() => navigate("/results/?monitor_id=" + monitorItem._id)}> <UnorderedListOutlined key="posts" /> Posts </Button>,
                        <Button  onClick={() => navigate("/results/summary?monitor_id=" + monitorItem._id)}><PieChartOutlined key="summary" /> Download</Button>,
                        <Button  onClick={() => showDuplicateModal(monitorItem)}><CopyOutlined key="duplicate" /> Duplicate</Button>,
                        <Button  onClick={() => showDeleteModal(monitorItem)}><DeleteOutlined key="delete" /> Delete</Button>,
                        // <CopyOutlined key="duplicate" onClick={() => showDuplicateModal(monitorItem)} />,
                        // <PieChartOutlined />\
                      ]}
                    >
                      <Meta                        
                        // title={monitorItem.title}
                        description={monitorDescription}
                      /> 
                    </Card> */}
                    <MonitorBlock extraButtons={extraButtons} monitorData={monitorItem}></MonitorBlock>
                  </Col>
                )
              })}
              
            </Row>
          ) : "Loading"
        }
      </List>
      </Space>
      </Row>
    </div>
  )
}

export default MonitorList;